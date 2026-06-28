'use client';
// app/(dashboard)/contacts/page.tsx
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Spinner } from '@/components/atoms/Spinner';
import type { Contact } from '@/types';

export default function ContactsPage() {
  const contacts = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await api.get('/contacts', { params: { limit: 50 } });
      return unwrap<Contact[]>(res.data);
    },
  });

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Ad',
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    { key: 'email', header: 'E-posta', render: (r) => r.email ?? '—' },
    { key: 'title', header: 'Ünvan', render: (r) => r.title ?? '—' },
    {
      key: 'company',
      header: 'Şirket',
      render: (r) => r.company?.name ?? '—',
    },
  ];

  return (
    <DashboardTemplate title="Kişiler">
      {contacts.isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={columns}
          rows={contacts.data ?? []}
          empty="Kişi yok"
        />
      )}
    </DashboardTemplate>
  );
}
