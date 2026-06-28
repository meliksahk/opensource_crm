'use client';
// src/components/templates/DashboardTemplate.tsx — korumalı panel iskeleti.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Spinner } from '../atoms/Spinner';
import { Sidebar } from '../organisms/Sidebar';
import { Topbar } from '../organisms/Topbar';

export function DashboardTemplate({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

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
          <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
}
