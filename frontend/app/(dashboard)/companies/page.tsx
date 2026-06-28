'use client';
// app/(dashboard)/companies/page.tsx
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import type { Company } from '@/types';

export default function CompaniesPage() {
  const companies = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const res = await api.get('/companies', { params: { limit: 50 } });
      return unwrap<Company[]>(res.data);
    },
  });

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Şirket', render: (r) => r.name },
    { key: 'domain', header: 'Alan adı', render: (r) => r.domain ?? '—' },
    { key: 'industry', header: 'Sektör', render: (r) => r.industry ?? '—' },
    {
      key: 'contacts',
      header: 'Kişi',
      render: (r) => <Badge tone="indigo">{r.contactCount}</Badge>,
    },
  ];

  return (
    <DashboardTemplate title="Şirketler">
      {companies.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={companies.data ?? []}
          empty="Şirket yok"
        />
      )}
    </DashboardTemplate>
  );
}
