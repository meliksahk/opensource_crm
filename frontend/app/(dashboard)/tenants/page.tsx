'use client';
// app/(dashboard)/tenants/page.tsx — v2.10 platform-admin: tenant listele/oluştur.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DataTable, Column } from '@/components/organisms/DataTable';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';
import { FormField } from '@/components/molecules/FormField';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}

export default function TenantsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', slug: '' });

  const tenants = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => unwrap<Tenant[]>((await api.get('/tenants')).data),
  });

  const create = useMutation({
    mutationFn: async () => api.post('/tenants', form),
    onSuccess: () => {
      setForm({ name: '', slug: '' });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });

  const columns: Column<Tenant>[] = [
    { key: 'name', header: 'Ad', render: (r) => r.name },
    { key: 'slug', header: 'Slug', render: (r) => r.slug },
    {
      key: 'isActive',
      header: 'Durum',
      render: (r) => (
        <Badge tone={r.isActive ? 'green' : 'gray'}>
          {r.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
  ];

  return (
    <DashboardTemplate title="Tenant'lar (Platform)">
      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormField
            id="t-name"
            label="Ad"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <FormField
            id="t-slug"
            label="Slug (a-z0-9-)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !form.name || !form.slug}
          >
            {create.isPending ? 'Ekleniyor…' : 'Tenant oluştur'}
          </Button>
          {create.isError && (
            <span className="text-sm text-red-600">Oluşturulamadı (slug?).</span>
          )}
        </div>
      </Card>

      {tenants.isLoading ? (
        <Spinner />
      ) : (
        <DataTable columns={columns} rows={tenants.data ?? []} empty="Tenant yok" />
      )}
    </DashboardTemplate>
  );
}
