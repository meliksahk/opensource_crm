'use client';
// app/(dashboard)/leads/page.tsx — nitelenmemiş Lead listesi + oluştur + dönüştür.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { FormField } from '@/components/molecules/FormField';
import { Spinner } from '@/components/atoms/Spinner';
import type { UnqualifiedLead } from '@/types';

const tone: Record<string, 'gray' | 'blue' | 'green' | 'amber' | 'red'> = {
  NEW: 'blue',
  WORKING: 'amber',
  QUALIFIED: 'green',
  UNQUALIFIED: 'red',
  CONVERTED: 'gray',
};

export default function LeadsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [company, setCompany] = useState('');

  const leads = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const res = await api.get('/leads', { params: { limit: 50 } });
      return unwrap<UnqualifiedLead[]>(res.data);
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/leads', {
        firstName: first,
        lastName: last,
        companyName: company || undefined,
      }),
    onSuccess: () => {
      setFirst('');
      setLast('');
      setCompany('');
      void qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const convert = useMutation({
    mutationFn: (id: string) => api.post(`/leads/${id}/convert`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const columns: Column<UnqualifiedLead>[] = [
    {
      key: 'name',
      header: 'Ad',
      render: (r) => `${r.firstName} ${r.lastName}`,
    },
    { key: 'company', header: 'Şirket', render: (r) => r.companyName ?? '—' },
    { key: 'source', header: 'Kaynak', render: (r) => r.source ?? '—' },
    {
      key: 'status',
      header: 'Durum',
      render: (r) => <Badge tone={tone[r.status]}>{r.status}</Badge>,
    },
    {
      key: 'action',
      header: '',
      render: (r) =>
        can('lead.convert') && r.status !== 'CONVERTED' ? (
          <Button
            variant="secondary"
            onClick={() => convert.mutate(r.id)}
            disabled={convert.isPending}
          >
            Dönüştür
          </Button>
        ) : null,
    },
  ];

  return (
    <DashboardTemplate title="Lead'ler (nitelenmemiş)">
      {can('lead.create') && (
        <Card className="mb-4 flex items-end gap-3 p-4">
          <FormField
            id="f"
            label="Ad"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
          <FormField
            id="l"
            label="Soyad"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
          <FormField
            id="c"
            label="Şirket"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Button
            disabled={!first || !last || create.isPending}
            onClick={() => create.mutate()}
          >
            Ekle
          </Button>
        </Card>
      )}
      {leads.isLoading ? (
        <Spinner />
      ) : (
        <DataTable columns={columns} rows={leads.data ?? []} empty="Lead yok" />
      )}
    </DashboardTemplate>
  );
}
