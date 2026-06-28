'use client';
// app/(dashboard)/invoices/page.tsx — fatura listesi (finansal alanlar izne göre).
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import type { Invoice } from '@/types';

const statusTone: Record<string, 'gray' | 'green' | 'amber' | 'red' | 'blue'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  PARTIALLY_PAID: 'amber',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'red',
};

export default function InvoicesPage() {
  const { can } = useAuth();
  const financial = can('invoice.read_financial');

  const invoices = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await api.get('/invoices', { params: { limit: 50 } });
      return unwrap<Invoice[]>(res.data);
    },
  });

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'No', render: (r) => r.number ?? '—' },
    { key: 'customer', header: 'Müşteri', render: (r) => r.customerName },
    {
      key: 'status',
      header: 'Durum',
      render: (r) => <Badge tone={statusTone[r.status] ?? 'gray'}>{r.status}</Badge>,
    },
    {
      key: 'total',
      header: 'Tutar',
      render: (r) =>
        financial ? (
          <span className="font-medium">
            {r.total} {r.currency}
          </span>
        ) : (
          <span className="text-gray-400">gizli</span>
        ),
    },
  ];

  return (
    <DashboardTemplate title="Faturalar">
      {!financial && (
        <p className="mb-3 text-xs text-amber-600">
          Finansal görüntüleme yetkiniz yok — tutarlar API tarafında maskelenir.
        </p>
      )}
      {invoices.isLoading ? (
        <Spinner />
      ) : (
        <DataTable columns={columns} rows={invoices.data ?? []} empty="Fatura yok" />
      )}
    </DashboardTemplate>
  );
}
