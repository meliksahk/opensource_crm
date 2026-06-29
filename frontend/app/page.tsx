'use client';
// app/page.tsx — Panel (özet istatistikler).
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { StatCard } from '@/components/molecules/StatCard';
import { Spinner } from '@/components/atoms/Spinner';

async function total(path: string): Promise<number> {
  const res = await api.get(path, { params: { limit: 1 } });
  return res.data?.meta?.total ?? 0;
}

export default function DashboardHome() {
  const { can } = useAuth();
  const { t } = useI18n();

  const deals = useQuery({
    queryKey: ['count', 'deals'],
    queryFn: () => total('/deals'),
    enabled: can('deal.read'),
  });
  const invoices = useQuery({
    queryKey: ['count', 'invoices'],
    queryFn: () => total('/invoices'),
    enabled: can('invoice.read'),
  });
  const users = useQuery({
    queryKey: ['count', 'users'],
    queryFn: () => total('/users'),
    enabled: can('user.read'),
  });

  // Yalnız yetkili (enabled) sorgular yüklenirken spinner göster.
  const anyLoading =
    (can('deal.read') && deals.isLoading) ||
    (can('invoice.read') && invoices.isLoading) ||
    (can('user.read') && users.isLoading);

  return (
    <DashboardTemplate title={t('page.dashboard')}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {can('deal.read') && (
          <StatCard
            label={t('dash.deals')}
            value={deals.isLoading ? '…' : (deals.data ?? 0)}
            hint={t('dash.dealsHint')}
          />
        )}
        {can('invoice.read') && (
          <StatCard
            label={t('dash.invoices')}
            value={invoices.isLoading ? '…' : (invoices.data ?? 0)}
            hint={t('dash.invoicesHint')}
          />
        )}
        {can('user.read') && (
          <StatCard
            label={t('dash.users')}
            value={users.isLoading ? '…' : (users.data ?? 0)}
            hint={t('dash.usersHint')}
          />
        )}
      </div>
      {!can('deal.read') && !can('invoice.read') && !can('user.read') && (
        <p className="text-sm text-gray-500">{t('dash.noModules')}</p>
      )}
      <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
        {anyLoading ? (
          <>
            <Spinner className="h-3 w-3" /> {t('dash.loading')}
          </>
        ) : (
          <>{t('dash.fresh')}</>
        )}
      </div>
    </DashboardTemplate>
  );
}
