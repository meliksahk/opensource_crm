'use client';
// src/components/organisms/Topbar.tsx — arama + dil seçici + çıkış (i18n).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';

export function Topbar() {
  const { user, logout } = useAuth();
  const { t, lang, setLang, languages } = useI18n();
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
          placeholder={t('topbar.search')}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>
      <div className="flex items-center gap-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          aria-label="language"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">{user?.email}</span>
        {user?.roles.map((r) => (
          <Badge key={r} tone="indigo">
            {r}
          </Badge>
        ))}
        <Button variant="secondary" onClick={() => void logout()}>
          {t('topbar.logout')}
        </Button>
      </div>
    </header>
  );
}
