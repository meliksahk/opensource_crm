'use client';
// app/(dashboard)/users/page.tsx — kullanıcı listesi.
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import type { User } from '@/types';

export default function UsersPage() {
  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 50 } });
      return unwrap<User[]>(res.data);
    },
  });

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Ad',
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    { key: 'email', header: 'E-posta', render: (r) => r.email },
    {
      key: 'roles',
      header: 'Roller',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles.map((role) => (
            <Badge key={role} tone="indigo">
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'active',
      header: 'Durum',
      render: (r) =>
        r.isActive ? (
          <Badge tone="green">Aktif</Badge>
        ) : (
          <Badge tone="red">Pasif</Badge>
        ),
    },
  ];

  return (
    <DashboardTemplate title="Kullanıcılar">
      {users.isLoading ? (
        <Spinner />
      ) : (
        <DataTable columns={columns} rows={users.data ?? []} empty="Kullanıcı yok" />
      )}
    </DashboardTemplate>
  );
}
