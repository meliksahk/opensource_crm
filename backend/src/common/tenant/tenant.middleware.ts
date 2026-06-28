// src/common/tenant/tenant.middleware.ts
// Tenant çözümleme: 'x-tenant-id' başlığı (ileride subdomain / JWT claim eklenebilir).
// İsteğin geri kalanı tenant bağlamı içinde çalışır → otomatik filtre etkinleşir.
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { runWithTenant } from './tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers['x-tenant-id'];
    const tenantId = typeof header === 'string' && header ? header : null;
    runWithTenant(tenantId, () => next());
  }
}
