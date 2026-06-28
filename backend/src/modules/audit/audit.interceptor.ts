// src/modules/audit/audit.interceptor.ts
// Değişiklik yapan istekleri (POST/PATCH/PUT/DELETE) başarıyla tamamlandığında
// denetim kaydına yazar. Okuma (GET) kaydedilmez.
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReqUser {
  id?: string;
  email?: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    if (!MUTATING.has(req.method)) {
      return next.handle();
    }
    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const { entity, entityId } = this.parsePath(req.path);
        const user = (req as Request & { user?: ReqUser }).user;
        // Fire-and-forget: yanıtı bekletmez.
        void this.audit.record({
          actorId: user?.id ?? null,
          actorEmail: user?.email ?? null,
          action: req.method,
          entity,
          entityId,
          path: req.path,
          statusCode: res.statusCode,
        });
      }),
    );
  }

  // /api/v1/deals/<uuid>/move → entity=deals, entityId=<uuid>
  private parsePath(path: string): { entity: string; entityId: string | null } {
    const parts = path.split('/').filter(Boolean);
    // ['api','v1','deals','<uuid>',...]
    const idx = parts.findIndex((p) => /^v\d+$/.test(p));
    const rest = idx >= 0 ? parts.slice(idx + 1) : parts;
    const entity = rest[0] ?? 'unknown';
    const entityId = rest.find((p) => UUID.test(p)) ?? null;
    return { entity, entityId };
  }
}
