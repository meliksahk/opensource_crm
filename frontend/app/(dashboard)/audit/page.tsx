'use client';
// app/(dashboard)/audit/page.tsx — v2.9 denetim kaydı (yalnız audit.read/ADMIN).
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';

interface AuditLog {
  id: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  statusCode: number;
  createdAt: string;
}

const ACTION_TONE: Record<string, 'green' | 'blue' | 'red'> = {
  POST: 'green',
  PATCH: 'blue',
  PUT: 'blue',
  DELETE: 'red',
};

export default function AuditPage() {
  const logs = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () =>
      unwrap<AuditLog[]>(
        (await api.get('/audit-logs', { params: { limit: 50 } })).data,
      ),
  });

  const columns: Column<AuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Zaman',
      render: (r) => new Date(r.createdAt).toLocaleString('tr-TR'),
    },
    { key: 'actorEmail', header: 'Aktör', render: (r) => r.actorEmail ?? '—' },
    {
      key: 'action',
      header: 'Eylem',
      render: (r) => (
        <Badge tone={ACTION_TONE[r.action] ?? 'gray'}>{r.action}</Badge>
      ),
    },
    { key: 'entity', header: 'Varlık', render: (r) => r.entity },
    {
      key: 'statusCode',
      header: 'Durum',
      render: (r) => r.statusCode,
    },
  ];

  return (
    <DashboardTemplate title="page.audit">
      {logs.isLoading ? (
        <Spinner />
      ) : (
        <DataTable columns={columns} rows={logs.data ?? []} empty="Kayıt yok" />
      )}
    </DashboardTemplate>
  );
}
