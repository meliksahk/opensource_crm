// backend/test/tenant.e2e-spec.ts
// Faz 6 E2E — Multi-tenancy: x-tenant-id bağlamı + merkezi otomatik filtre (Lead dilimi).
// T-6.1 izolasyon, T-6.2 cross-tenant erişim engeli, T-6.3 otomatik tenantId atama.
process.env.THROTTLE_LIMIT = '1000';

import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

const base = '/api/v1';

describe('Multi-tenancy (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  let pipelineId: string;
  let stageNew: string;
  const ts = Date.now();
  const tenantA = `tenant-a-${ts}`;
  const tenantB = `tenant-b-${ts}`;
  let leadA: string;
  let leadB: string;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@crm.dev';
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const authA = { Authorization: '', 'x-tenant-id': tenantA };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);

    adminToken = (
      await request(app.getHttpServer())
        .post(`${base}/auth/login`)
        .send({ email: adminEmail, password: adminPw })
        .expect(200)
    ).body.data.accessToken;
    authA.Authorization = `Bearer ${adminToken}`;

    const pipeline = await prisma.pipeline.findFirstOrThrow({
      where: { isDefault: true },
      include: { stages: { orderBy: { position: 'asc' } } },
    });
    pipelineId = pipeline.id;
    stageNew = pipeline.stages[0].id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.lead.deleteMany({
        where: { tenantId: { in: [tenantA, tenantB] } },
      });
      await prisma.$disconnect();
    }
    await app?.close();
  });

  const createLeadFor = (tenant: string, title: string) =>
    request(app.getHttpServer())
      .post(`${base}/leads`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenant)
      .send({ pipelineId, stageId: stageNew, title })
      .expect(201);

  // T-6.3 — create sırasında tenantId otomatik atanır
  it('T-6.3 create: tenantId otomatik atanır (merkezi middleware)', async () => {
    leadA = (await createLeadFor(tenantA, 'A-Lead')).body.data.id;
    leadB = (await createLeadFor(tenantB, 'B-Lead')).body.data.id;

    // Bağlamsız doğrudan okuma: kayıtların tenantId'si doğru
    const a = await prisma.lead.findUnique({ where: { id: leadA } });
    const b = await prisma.lead.findUnique({ where: { id: leadB } });
    expect(a?.tenantId).toBe(tenantA);
    expect(b?.tenantId).toBe(tenantB);
  });

  // T-6.1 — tenant A yalnız kendi lead'lerini görür
  it("T-6.1 GET /leads (tenant A) → yalnız A lead'leri", async () => {
    const r = await request(app.getHttpServer())
      .get(`${base}/leads?pipelineId=${pipelineId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenantA)
      .expect(200);
    const ids = r.body.data.map((l: { id: string }) => l.id);
    expect(ids).toContain(leadA);
    expect(ids).not.toContain(leadB);
  });

  it("GET /leads (tenant B) → yalnız B lead'leri", async () => {
    const r = await request(app.getHttpServer())
      .get(`${base}/leads?pipelineId=${pipelineId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenantB)
      .expect(200);
    const ids = r.body.data.map((l: { id: string }) => l.id);
    expect(ids).toContain(leadB);
    expect(ids).not.toContain(leadA);
  });

  // T-6.2 — cross-tenant erişim engeli
  it('T-6.2 tenant B token ile A lead :id → 404', () =>
    request(app.getHttpServer())
      .get(`${base}/leads/${leadA}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenantB)
      .expect(404));

  it('tenant A kendi lead :id → 200', () =>
    request(app.getHttpServer())
      .get(`${base}/leads/${leadA}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('x-tenant-id', tenantA)
      .expect(200));
});
