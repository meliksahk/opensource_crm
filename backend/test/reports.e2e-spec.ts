// backend/test/reports.e2e-spec.ts — v2.4 raporlama/forecast.
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

describe('Reports (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let salesToken: string;
  let financeToken: string;
  const roleId: Record<string, string> = {};
  const testUserIds: string[] = [];
  let pipelineId: string;

  const pw = 'S3cure!Passw0rd';
  const ts = Date.now();
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@crm.dev';
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!2026';
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const login = (e: string, p: string) =>
    request(app.getHttpServer())
      .post(`${base}/auth/login`)
      .send({ email: e, password: p });

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

    adminToken = (await login(adminEmail, adminPw).expect(200)).body.data
      .accessToken;
    const roles = await request(app.getHttpServer())
      .get(`${base}/roles`)
      .set(auth(adminToken))
      .expect(200);
    for (const r of roles.body.data) roleId[r.name] = r.id;

    const mk = async (email: string, role: string) => {
      const res = await request(app.getHttpServer())
        .post(`${base}/users`)
        .set(auth(adminToken))
        .send({
          email,
          password: pw,
          firstName: 'R',
          lastName: 'P',
          roleIds: [roleId[role]],
        })
        .expect(201);
      testUserIds.push(res.body.data.id);
      return res.body.data.id;
    };
    await mk(`rep_sales_${ts}@crm.dev`, 'SALES');
    await mk(`rep_fin_${ts}@crm.dev`, 'FINANCE');
    salesToken = (await login(`rep_sales_${ts}@crm.dev`, pw).expect(200)).body
      .data.accessToken;
    financeToken = (await login(`rep_fin_${ts}@crm.dev`, pw).expect(200)).body
      .data.accessToken;

    const pipeline = await prisma.pipeline.findFirstOrThrow({
      where: { isDefault: true },
    });
    pipelineId = pipeline.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { id: { in: testUserIds } } });
      await prisma.$disconnect();
    }
    await app?.close();
  });

  it('GET /reports/pipeline → stage başına açık sayım/değer', async () => {
    const r = await request(app.getHttpServer())
      .get(`${base}/reports/pipeline?pipelineId=${pipelineId}`)
      .set(auth(salesToken))
      .expect(200);
    expect(Array.isArray(r.body.data.stages)).toBe(true);
    expect(r.body.data.stages[0]).toHaveProperty('openCount');
    expect(r.body.data.stages[0]).toHaveProperty('openValue');
  });

  it('GET /reports/forecast → ağırlıklı forecast döner', async () => {
    const r = await request(app.getHttpServer())
      .get(`${base}/reports/forecast`)
      .set(auth(salesToken))
      .expect(200);
    expect(r.body.data).toHaveProperty('weightedForecast');
    expect(r.body.data).toHaveProperty('openValue');
  });

  it('GET /reports/invoices/summary → FINANCE 200, SALES 403', async () => {
    await request(app.getHttpServer())
      .get(`${base}/reports/invoices/summary`)
      .set(auth(financeToken))
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('totalInvoiced');
        expect(res.body.data).toHaveProperty('outstanding');
      });
    await request(app.getHttpServer())
      .get(`${base}/reports/invoices/summary`)
      .set(auth(salesToken))
      .expect(403);
  });
});
