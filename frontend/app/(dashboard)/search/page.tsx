'use client';
// app/(dashboard)/search/page.tsx — v2.9 global arama sonuçları.
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import { DashboardTemplate } from '@/components/templates/DashboardTemplate';
import { Card } from '@/components/atoms/Card';
import { Spinner } from '@/components/atoms/Spinner';
import { Badge } from '@/components/atoms/Badge';

interface SearchResult {
  query: string;
  deals: { id: string; title: string; company: string | null; status: string }[];
  contacts: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
  }[];
  companies: { id: string; name: string; domain: string | null }[];
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const params = useSearchParams();
  const q = params.get('q') ?? '';

  const res = useQuery({
    queryKey: ['search', q],
    enabled: q.trim().length >= 2,
    queryFn: async () =>
      unwrap<SearchResult>(
        (await api.get('/search', { params: { q } })).data,
      ),
  });

  return (
    <DashboardTemplate title="page.search">
      {res.isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-4">
          <Section title="Anlaşmalar" empty="Anlaşma yok">
            {res.data?.deals.map((d) => (
              <Row key={d.id}>
                <span>{d.title}</span>
                <Badge tone="blue">{d.status}</Badge>
              </Row>
            ))}
          </Section>
          <Section title="Kişiler" empty="Kişi yok">
            {res.data?.contacts.map((c) => (
              <Row key={c.id}>
                <span>
                  {c.firstName} {c.lastName}
                </span>
                <span className="text-xs text-gray-500">{c.email ?? '—'}</span>
              </Row>
            ))}
          </Section>
          <Section title="Şirketler" empty="Şirket yok">
            {res.data?.companies.map((c) => (
              <Row key={c.id}>
                <span>{c.name}</span>
                <span className="text-xs text-gray-500">{c.domain ?? '—'}</span>
              </Row>
            ))}
          </Section>
        </div>
      )}
    </DashboardTemplate>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.some(Boolean) && arr.flat().filter(Boolean).length > 0;
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{title}</h3>
      {hasItems ? (
        <div className="divide-y divide-gray-100">{children}</div>
      ) : (
        <p className="text-sm text-gray-400">{empty}</p>
      )}
    </Card>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm text-gray-700">
      {children}
    </div>
  );
}
