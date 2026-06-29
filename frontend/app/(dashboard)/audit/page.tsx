'use client';
// app/(dashboard)/audit/page.tsx — v2.9 denetim kaydı (yalnız audit.read/ADMIN).
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
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
  const { t } = useI18n();
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
      header: t('col.time'),
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    { key: 'actorEmail', header: t('col.actor'), render: (r) => r.actorEmail ?? '—' },
    {
      key: 'action',
      header: t('col.method'),
      render: (r) => (
        <Badge tone={ACTION_TONE[r.action] ?? 'gray'}>{r.action}</Badge>
      ),
    },
    { key: 'entity', header: t('col.entity'), render: (r) => r.entity },
    {
      key: 'statusCode',
      header: t('col.status'),
      render: (r) => r.statusCode,
    },
  ];

  return (
    <DashboardTemplate title="page.audit">
      {logs.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={logs.data ?? []}
          empty={t('common.empty')}
        />
      )}
    </DashboardTemplate>
  );
}
