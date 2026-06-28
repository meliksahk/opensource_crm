'use client';
// src/components/organisms/Topbar.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <form onSubmit={submit} className="w-72">
        <Input
          placeholder="Ara (deal, kişi, şirket)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{user?.email}</span>
        {user?.roles.map((r) => (
          <Badge key={r} tone="indigo">
            {r}
          </Badge>
        ))}
        <Button variant="secondary" onClick={() => void logout()}>
          Çıkış
        </Button>
      </div>
    </header>
  );
}
