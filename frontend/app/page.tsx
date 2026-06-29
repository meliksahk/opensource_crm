'use client';
// app/page.tsx — Panel: rapor KPI'ları + mini grafikler + kısayollar.
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { StatCard } from '@/components/molecules/StatCard';
import { Card } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';
import { BarChart, DonutChart } from '@/components/molecules/Charts';

const num = (s: string | number | undefined) => Number(s ?? 0);
const money = (n: number) => n.toLocaleString();
const shortMonth = (m: string) => m.slice(2);

export default function DashboardHome() {
  const { can } = useAuth();
  const { t } = useI18n();
  const sales = can('deal.read');
  const financial = can('invoice.read_financial');

  const forecast = useQuery({
    queryKey: ['dash-forecast'],
    enabled: sales,
    queryFn: async () =>
      unwrap<{ openCount: number; openValue: string; weightedForecast: string }>(
        (await api.get('/reports/forecast')).data,
      ),
  });
  const wonLost = useQuery({
    queryKey: ['dash-won-lost'],
    enabled: sales,
    queryFn: async () =>
      unwrap<{
        winRate: number;
        months: { month: string; wonCount: number; lostCount: number }[];
      }>((await api.get('/reports/deals/won-lost', { params: { months: 6 } })).data),
  });
  const summary = useQuery({
    queryKey: ['dash-summary'],
    enabled: sales,
    queryFn: async () =>
      unwrap<Record<string, { count: number; value: string }>>(
        (await api.get('/reports/deals/summary')).data,
      ),
  });
  const invoices = useQuery({
    queryKey: ['dash-invoices'],
    enabled: financial,
    queryFn: async () =>
      unwrap<{ totalInvoiced: string; outstanding: string }>(
        (await api.get('/reports/invoices/summary')).data,
      ),
  });
  const revenue = useQuery({
    queryKey: ['dash-revenue'],
    enabled: financial,
    queryFn: async () =>
      unwrap<{ months: { month: string; invoiced: string; paid: string }[] }>(
        (await api.get('/reports/revenue/monthly', { params: { months: 6 } })).data,
      ),
  });

  // Kısayollar (yetkiye göre).
  const links: { href: string; label: string; show: boolean }[] = [
    { href: '/deals', label: t('nav.deals'), show: sales },
    { href: '/leads', label: t('nav.leads'), show: can('lead.read') },
    { href: '/lead-forms', label: t('nav.leadForms'), show: can('lead_form.read') },
    { href: '/quotes', label: t('nav.quotes'), show: can('quote.read') },
    { href: '/invoices', label: t('nav.invoices'), show: can('invoice.read') },
    { href: '/reports', label: t('nav.reports'), show: sales },
    { href: '/pipeline', label: t('nav.pipeline'), show: can('pipeline.read') },
  ].filter((l) => l.show);

  return (
    <DashboardTemplate title={t('page.dashboard')}>
      {/* KPI'lar */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sales && (
          <>
            <StatCard
              label={t('rep.openDeals')}
              value={forecast.isLoading ? '…' : (forecast.data?.openCount ?? 0)}
              hint={`${t('rep.valuePrefix')}: ${forecast.data?.openValue ?? '—'}`}
            />
            <StatCard
              label={t('rep.forecast')}
              value={forecast.isLoading ? '…' : (forecast.data?.weightedForecast ?? 0)}
              hint={t('rep.forecastHint')}
            />
            <StatCard
              label={t('rep.winRate')}
              value={wonLost.isLoading ? '…' : `%${wonLost.data?.winRate ?? 0}`}
              hint={t('rep.wonLostTitle')}
            />
          </>
        )}
        {financial && (
          <StatCard
            label={t('rep.outstanding')}
            value={invoices.isLoading ? '…' : (invoices.data?.outstanding ?? 0)}
            hint={`${t('rep.invoicedPrefix')}: ${invoices.data?.totalInvoiced ?? '—'}`}
          />
        )}
      </div>

      {!sales && !financial && (
        <p className="mb-4 text-sm text-gray-500">{t('dash.noModules')}</p>
      )}

      {/* Mini grafikler */}
      {sales && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              {t('rep.wonLostTitle')}
            </h3>
            {wonLost.isLoading ? (
              <Spinner />
            ) : (
              <BarChart
                labels={(wonLost.data?.months ?? []).map((m) => shortMonth(m.month))}
                series={[
                  { name: t('rep.won'), color: '#10b981' },
                  { name: t('rep.lost'), color: '#ef4444' },
                ]}
                values={[
                  (wonLost.data?.months ?? []).map((m) => m.wonCount),
                  (wonLost.data?.months ?? []).map((m) => m.lostCount),
                ]}
                height={150}
              />
            )}
          </Card>

          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              {financial ? t('rep.revenueTitle') : t('rep.statusTitle')}
            </h3>
            {financial ? (
              revenue.isLoading ? (
                <Spinner />
              ) : (
                <BarChart
                  labels={(revenue.data?.months ?? []).map((m) => shortMonth(m.month))}
                  series={[
                    { name: t('rep.invoiced'), color: '#6366f1' },
                    { name: t('rep.paid'), color: '#10b981' },
                  ]}
                  values={[
                    (revenue.data?.months ?? []).map((m) => num(m.invoiced)),
                    (revenue.data?.months ?? []).map((m) => num(m.paid)),
                  ]}
                  format={money}
                  height={150}
                />
              )
            ) : summary.isLoading ? (
              <Spinner />
            ) : (
              <DonutChart
                data={[
                  { label: t('rep.open'), value: summary.data?.OPEN?.count ?? 0, color: '#3b82f6' },
                  { label: t('rep.won'), value: summary.data?.WON?.count ?? 0, color: '#10b981' },
                  { label: t('rep.lost'), value: summary.data?.LOST?.count ?? 0, color: '#ef4444' },
                ]}
              />
            )}
          </Card>
        </div>
      )}

      {/* Kısayollar */}
      {links.length > 0 && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            {t('dash.quickLinks')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {l.label} →
              </Link>
            ))}
          </div>
        </Card>
      )}
    </DashboardTemplate>
  );
}
