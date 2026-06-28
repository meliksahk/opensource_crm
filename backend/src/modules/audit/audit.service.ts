// src/modules/audit/audit.service.ts
// İŞ MANTIĞI: denetim kaydı yaz + sorgula. Yazma fire-and-forget (isteği bloklamaz).
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditRepository } from './audit.repository';

export interface AuditEntry {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  path: string;
  statusCode: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly repo: AuditRepository) {}

  // Hata olursa yutulur — denetim yazımı asıl isteği bozmamalı.
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.create({
        actorId: entry.actorId ?? null,
        actorEmail: entry.actorEmail ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        path: entry.path,
        statusCode: entry.statusCode,
      });
    } catch (err) {
      this.logger.warn(
        `audit yazılamadı: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async list(params: {
    entity?: string;
    actorId?: string;
    page: number;
    limit: number;
    skip: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (params.entity) where.entity = params.entity;
    if (params.actorId) where.actorId = params.actorId;
    const { items, total } = await this.repo.list(
      where,
      params.skip,
      params.limit,
    );
    return {
      data: items,
      meta: { page: params.page, limit: params.limit, total },
    };
  }
}
