// src/modules/reports/reports.service.ts
// İŞ MANTIĞI: rapor toplulaştırma + ağırlıklı forecast (Decimal).
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ReportsRepository } from './reports.repository';

const D = Prisma.Decimal;

@Injectable()
export class ReportsService {
  constructor(private readonly repo: ReportsRepository) {}

  async pipeline(pipelineId: string) {
    const [stages, byStage] = await Promise.all([
      this.repo.stages(pipelineId),
      this.repo.dealsByStage(pipelineId),
    ]);
    const map = new Map(byStage.map((b) => [b.stageId, b]));
    return {
      pipelineId,
      stages: stages.map((s) => {
        const agg = map.get(s.id);
        return {
          stageId: s.id,
          name: s.name,
          position: s.position,
          openCount: agg?._count._all ?? 0,
          openValue: (agg?._sum.value ?? new D(0)).toString(),
        };
      }),
    };
  }

  async dealsSummary() {
    const byStatus = await this.repo.dealsByStatus();
    const result: Record<string, { count: number; value: string }> = {};
    for (const row of byStatus) {
      result[row.status] = {
        count: row._count._all,
        value: (row._sum.value ?? new D(0)).toString(),
      };
    }
    return result;
  }

  // Ağırlıklı forecast: açık deal değeri × (stage pozisyonu / pipeline stage sayısı).
  async forecast() {
    const [openDeals, stageCounts] = await Promise.all([
      this.repo.openDeals(),
      this.repo.stageCountByPipeline(),
    ]);
    const countByPipeline = new Map(
      stageCounts.map((s) => [s.pipelineId, s._count._all]),
    );
    let weighted = new D(0);
    let openValue = new D(0);
    for (const d of openDeals) {
      if (!d.value) continue;
      openValue = openValue.plus(d.value);
      const total = countByPipeline.get(d.stage.pipelineId) ?? 1;
      // pozisyon 0-tabanlı → (pos+1)/total olasılık
      const prob = Math.min(1, (d.stage.position + 1) / total);
      weighted = weighted.plus(d.value.mul(prob));
    }
    return {
      openCount: openDeals.length,
      openValue: openValue.toDecimalPlaces(2).toString(),
      weightedForecast: weighted.toDecimalPlaces(2).toString(),
    };
  }

  async invoicesSummary() {
    const agg = await this.repo.invoiceTotals();
    const total = agg._sum.total ?? new D(0);
    const paid = agg._sum.amountPaid ?? new D(0);
    return {
      totalInvoiced: total.toString(),
      totalPaid: paid.toString(),
      outstanding: total.minus(paid).toString(),
    };
  }
}
