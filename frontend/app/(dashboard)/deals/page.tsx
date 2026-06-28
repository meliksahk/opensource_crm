'use client';
// app/(dashboard)/deals/page.tsx — Kanban panosu + yeni deal.
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { DealsBoard } from '@/components/organisms/DealsBoard';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { FormField } from '@/components/molecules/FormField';
import { Card } from '@/components/atoms/Card';
import type { Board } from '@/types';

export default function DealsPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState('');

  const pipelines = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      // Pipeline listesi için board üzerinden ilk pipeline'ı bul (demo: tek hat).
      const res = await api.get('/deals', { params: { limit: 1 } });
      const data = unwrap<{ pipelineId?: string }[]>(res.data);
      return data[0]?.pipelineId ?? null;
    },
  });

  const board = useQuery({
    queryKey: ['board', pipelines.data],
    queryFn: async () => {
      const res = await api.get('/deals/board', {
        params: { pipelineId: pipelines.data },
      });
      return unwrap<Board>(res.data);
    },
    enabled: !!pipelines.data,
  });

  const firstStage = board.data?.stages[0]?.id;

  const createDeal = useMutation({
    mutationFn: async () => {
      await api.post('/deals', {
        pipelineId: pipelines.data,
        stageId: firstStage,
        title,
      });
    },
    onSuccess: () => {
      setTitle('');
      void qc.invalidateQueries({ queryKey: ['board'] });
    },
  });

  return (
    <DashboardTemplate title="Satış (Deal) — Kanban">
      {can('deal.create') && pipelines.data && firstStage && (
        <Card className="mb-4 flex items-end gap-3 p-4">
          <div className="flex-1">
            <FormField
              id="deal-title"
              label="Yeni deal başlığı"
              placeholder="Örn. ACME teklifi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <Button
            disabled={!title || createDeal.isPending}
            onClick={() => createDeal.mutate()}
          >
            {createDeal.isPending ? 'Ekleniyor…' : 'Ekle'}
          </Button>
        </Card>
      )}

      {board.isLoading || pipelines.isLoading ? (
        <Spinner />
      ) : board.data ? (
        <DealsBoard board={board.data} />
      ) : (
        <p className="text-sm text-gray-500">Pipeline bulunamadı.</p>
      )}
    </DashboardTemplate>
  );
}
