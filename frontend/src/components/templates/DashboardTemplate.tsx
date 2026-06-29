'use client';
// src/components/templates/DashboardTemplate.tsx — korumalı panel iskeleti.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Spinner } from '../atoms/Spinner';
import { Sidebar } from '../organisms/Sidebar';
import { Topbar } from '../organisms/Topbar';

export function DashboardTemplate({
  title,
  children,
}: {
  title: string; // "page.*" ise çevrilir; değilse düz metin gösterilir
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const titleText = title.startsWith('page.') ? t(title) : title;

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            {titleText}
          </h2>
          {children}
        </main>
      </div>
    </div>
  );
}
