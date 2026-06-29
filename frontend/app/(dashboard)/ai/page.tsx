'use client';
// app/(dashboard)/ai/page.tsx — v2.6 AI Asistan: durum + e-posta taslağı + özetleme.
// Anahtar yoksa backend 503 verir; sayfa bunu bilgi şeridi ile gösterir.
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Textarea } from '@/components/atoms/Textarea';
import { Spinner } from '@/components/atoms/Spinner';

interface EmailDraft {
  subject: string;
  body: string;
}
interface Summary {
  summary: string;
  highlights: string[];
}

export default function AiPage() {
  const { t } = useI18n();
  const status = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () =>
      unwrap<{ enabled: boolean; model: string }>(
        (await api.get('/ai/status')).data,
      ),
  });

  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [text, setText] = useState('');

  const draft = useMutation({
    mutationFn: async () =>
      unwrap<EmailDraft>(
        (await api.post('/ai/draft-email', { context, tone })).data,
      ),
  });

  const summary = useMutation({
    mutationFn: async () =>
      unwrap<Summary>((await api.post('/ai/summarize', { text })).data),
  });

  const errMsg = (e: unknown) =>
    (e as { response?: { status?: number } })?.response?.status === 503
      ? t('ai.err503')
      : t('ai.errGeneric');

  return (
    <DashboardTemplate title="page.ai">
      {status.data && !status.data.enabled && (
        <Card className="mb-4 border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          {t('ai.disabledMsg')}
        </Card>
      )}
      {status.data?.enabled && (
        <Card className="mb-4 border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
          {t('ai.enabledPrefix')} <code>{status.data.model}</code>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* E-posta taslağı */}
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {t('ai.draftTitle')}
          </h3>
          <Textarea
            rows={4}
            placeholder={t('ai.draftPh')}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="mb-2"
          />
          <div className="mb-2 flex items-center gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            >
              <option value="professional">{t('ai.toneProfessional')}</option>
              <option value="friendly">{t('ai.toneFriendly')}</option>
              <option value="formal">{t('ai.toneFormal')}</option>
            </select>
            <Button
              onClick={() => draft.mutate()}
              disabled={draft.isPending || context.trim().length < 3}
            >
              {draft.isPending ? '…' : t('ai.draftBtn')}
            </Button>
          </div>
          {draft.isPending && <Spinner />}
          {draft.isError && (
            <p className="text-sm text-red-600">{errMsg(draft.error)}</p>
          )}
          {draft.data && (
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
              <p className="font-semibold">{draft.data.subject}</p>
              <p className="mt-1 whitespace-pre-wrap text-gray-700">
                {draft.data.body}
              </p>
            </div>
          )}
        </Card>

        {/* Özetleme */}
        <Card className="p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {t('ai.sumTitle')}
          </h3>
          <Textarea
            rows={4}
            placeholder={t('ai.sumPh')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mb-2"
          />
          <Button
            onClick={() => summary.mutate()}
            disabled={summary.isPending || text.trim().length < 3}
          >
            {summary.isPending ? '…' : t('ai.sumBtn')}
          </Button>
          {summary.isPending && <Spinner />}
          {summary.isError && (
            <p className="text-sm text-red-600">{errMsg(summary.error)}</p>
          )}
          {summary.data && (
            <div className="mt-2 rounded-md bg-gray-50 p-3 text-sm">
              <p className="text-gray-700">{summary.data.summary}</p>
              {summary.data.highlights?.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-gray-600">
                  {summary.data.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>
      </div>
    </DashboardTemplate>
  );
}
