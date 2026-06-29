'use client';
// app/(dashboard)/roles/page.tsx — rol yönetimi (CRUD + izin atama).
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { RoleModal, Role } from '@/components/organisms/RoleModal';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';

export default function RolesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Role | null>(null);

  const roles = useQuery({
    queryKey: ['roles-admin'],
    queryFn: async () => unwrap<Role[]>((await api.get('/roles')).data),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['roles-admin'] });
    qc.invalidateQueries({ queryKey: ['roles'] });
  };

  const columns: Column<Role>[] = [
    { key: 'name', header: 'Rol', render: (r) => <Badge tone="indigo">{r.name}</Badge> },
    { key: 'description', header: 'Açıklama', render: (r) => r.description ?? '—' },
    {
      key: 'perms',
      header: 'İzin sayısı',
      render: (r) => `${r.permissions.length}`,
    },
  ];

  return (
    <DashboardTemplate title="page.roles">
      {can('role.create') && (
        <div className="mb-4">
          <Button onClick={() => setCreating(true)}>+ Yeni rol</Button>
        </div>
      )}

      {roles.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={roles.data ?? []}
          empty="Rol yok"
          onRowClick={can('role.update') ? setEditing : undefined}
        />
      )}

      {creating && (
        <RoleModal role={null} onClose={() => setCreating(false)} onSaved={invalidate} />
      )}
      {editing && (
        <RoleModal role={editing} onClose={() => setEditing(null)} onSaved={invalidate} />
      )}
    </DashboardTemplate>
  );
}
