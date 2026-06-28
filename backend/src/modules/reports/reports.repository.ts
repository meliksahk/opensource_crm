// src/modules/reports/reports.repository.ts
// VERİ ERİŞİMİ: rapor toplulaştırmaları (Prisma groupBy/aggregate).
import { Injectable } from '@nestjs/common';
import { DealStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  stages(pipelineId: string) {
    return this.prisma.stage.findMany({
      where: { pipelineId },
      orderBy: { position: 'asc' },
    });
  }

  dealsByStage(pipelineId: string) {
    return this.prisma.deal.groupBy({
      by: ['stageId'],
      where: { pipelineId, deletedAt: null, status: DealStatus.OPEN },
      _count: { _all: true },
      _sum: { value: true },
    });
  }

  dealsByStatus() {
    return this.prisma.deal.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { value: true },
    });
  }

  // Forecast için: açık deal'ler + stage pozisyonu.
  openDeals() {
    return this.prisma.deal.findMany({
      where: { deletedAt: null, status: DealStatus.OPEN },
      select: {
        value: true,
        stage: { select: { position: true, pipelineId: true } },
      },
    });
  }

  stageCountByPipeline() {
    return this.prisma.stage.groupBy({
      by: ['pipelineId'],
      _count: { _all: true },
    });
  }

  async invoiceTotals() {
    const all = await this.prisma.invoice.aggregate({
      where: { status: { not: InvoiceStatus.CANCELLED } },
      _sum: { total: true, amountPaid: true },
    });
    return all;
  }
}
