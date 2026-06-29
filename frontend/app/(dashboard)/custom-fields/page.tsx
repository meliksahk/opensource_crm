'use client';
// app/(dashboard)/custom-fields/page.tsx — özel alan tanımları (low-code) CRUD.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { CustomFieldModal, FieldDef } from '@/components/organisms/CustomFieldModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

export default function CustomFieldsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<FieldDef | null>(null);
  const manage = can('custom_field.manage');

  const defs = useQuery({
    queryKey: ['custom-fields'],
    queryFn: async () =>
      unwrap<FieldDef[]>((await api.get('/custom-fields')).data),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['custom-fields'] });

  const columns: Column<FieldDef>[] = [
    { key: 'entity', header: 'Varlık', render: (r) => <Badge tone="indigo">{r.entity}</Badge> },
    { key: 'key', header: 'Anahtar', render: (r) => r.key },
    { key: 'label', header: 'Etiket', render: (r) => r.label },
    { key: 'type', header: 'Tip', render: (r) => r.type },
    {
      key: 'required',
      header: 'Zorunlu',
      render: (r) => (r.required ? <Badge tone="amber">Evet</Badge> : '—'),
    },
  ];

  return (
    <DashboardTemplate title="page.customFields">
      {manage && (
        <div className="mb-4">
          <Button onClick={() => setCreating(true)}>+ Yeni alan</Button>
        </div>
      )}

      {defs.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={defs.data ?? []}
          empty="Özel alan yok"
          onRowClick={manage ? setEditing : undefined}
        />
      )}

      {creating && (
        <CustomFieldModal def={null} onClose={() => setCreating(false)} onSaved={invalidate} />
      )}
      {editing && (
        <CustomFieldModal def={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
      )}
    </DashboardTemplate>
  );
}
