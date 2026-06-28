'use client';
// app/(dashboard)/reports/page.tsx — pipeline raporu + forecast + (finans) fatura özeti.
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { StatCard } from '@/components/molecules/StatCard';
import { Spinner } from '@/components/atoms/Spinner';

interface PipelineReport {
  stages: {
    stageId: string;
    name: string;
    openCount: number;
    openValue: string;
  }[];
}

export default function ReportsPage() {
  const { can } = useAuth();

  const pipelineId = useQuery({
    queryKey: ['report-pipelineId'],
    queryFn: async () => {
      const res = await api.get('/deals', { params: { limit: 1 } });
      const data = unwrap<{ pipelineId?: string }[]>(res.data);
      return data[0]?.pipelineId ?? null;
    },
  });

  const pipeline = useQuery({
    queryKey: ['report-pipeline', pipelineId.data],
    enabled: !!pipelineId.data,
    queryFn: async () => {
      const res = await api.get('/reports/pipeline', {
        params: { pipelineId: pipelineId.data },
      });
      return unwrap<PipelineReport>(res.data);
    },
  });

  const forecast = useQuery({
    queryKey: ['report-forecast'],
    queryFn: async () => {
      const res = await api.get('/reports/forecast');
      return unwrap<{
        openCount: number;
        openValue: string;
        weightedForecast: string;
      }>(res.data);
    },
  });

  const invoices = useQuery({
    queryKey: ['report-invoices'],
    enabled: can('invoice.read_financial'),
    queryFn: async () => {
      const res = await api.get('/reports/invoices/summary');
      return unwrap<{
        totalInvoiced: string;
        totalPaid: string;
        outstanding: string;
      }>(res.data);
    },
  });

  return (
    <DashboardTemplate title="Raporlar">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Açık anlaşma"
          value={forecast.data?.openCount ?? '…'}
          hint={`Değer: ${forecast.data?.openValue ?? '—'}`}
        />
        <StatCard
          label="Ağırlıklı forecast"
          value={forecast.data?.weightedForecast ?? '…'}
          hint="Aşama olasılığıyla"
        />
        {can('invoice.read_financial') && (
          <StatCard
            label="Açık alacak"
            value={invoices.data?.outstanding ?? '…'}
            hint={`Faturalanan: ${invoices.data?.totalInvoiced ?? '—'}`}
          />
        )}
      </div>

      <h3 className="mb-2 text-sm font-semibold text-gray-700">
        Pipeline — aşamaya göre açık anlaşmalar
      </h3>
      {pipeline.isLoading ? (
        <Spinner />
      ) : (
        <Card className="p-4">
          <div className="space-y-2">
            {pipeline.data?.stages.map((s) => {
              const max = Math.max(
                1,
                ...((pipeline.data?.stages ?? []).map((x) => x.openCount) || [1]),
              );
              return (
                <div key={s.stageId} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-600">{s.name}</span>
                  <div className="h-4 flex-1 rounded bg-gray-100">
                    <div
                      className="h-4 rounded bg-brand-500"
                      style={{ width: `${(s.openCount / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-32 text-right text-xs text-gray-500">
                    {s.openCount} adet · {s.openValue}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </DashboardTemplate>
  );
}
