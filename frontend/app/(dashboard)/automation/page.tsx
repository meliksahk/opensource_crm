'use client';
// app/(dashboard)/automation/page.tsx — otomasyon kuralları (no-code) CRUD.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import {
  AutomationRuleModal,
  Rule,
} from '@/components/organisms/AutomationRuleModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

export default function AutomationPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const manage = can('automation.manage');

  const rules = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () =>
      unwrap<Rule[]>(
        (await api.get('/automation/rules', { params: { limit: 50 } })).data,
      ),
  });
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['automation-rules'] });

  const columns: Column<Rule>[] = [
    { key: 'name', header: 'Ad', render: (r) => r.name },
    {
      key: 'trigger',
      header: 'Tetikleyici',
      render: (r) => <Badge tone="blue">{r.trigger}</Badge>,
    },
    {
      key: 'actions',
      header: 'Eylem',
      render: (r) => `${r.actions?.length ?? 0} adet`,
    },
    {
      key: 'active',
      header: 'Durum',
      render: (r) =>
        r.isActive ? (
          <Badge tone="green">Aktif</Badge>
        ) : (
          <Badge tone="gray">Pasif</Badge>
        ),
    },
  ];

  return (
    <DashboardTemplate title="Otomasyon Kuralları">
      {manage && (
        <div className="mb-4">
          <Button onClick={() => setCreating(true)}>+ Yeni kural</Button>
        </div>
      )}

      {rules.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={rules.data ?? []}
          empty="Kural yok"
          onRowClick={manage ? setEditing : undefined}
        />
      )}

      {creating && (
        <AutomationRuleModal
          rule={null}
          onClose={() => setCreating(false)}
          onSaved={invalidate}
        />
      )}
      {editing && (
        <AutomationRuleModal
          rule={editing}
          onClose={() => setEditing(null)}
          onSaved={invalidate}
        />
      )}
    </DashboardTemplate>
  );
}
