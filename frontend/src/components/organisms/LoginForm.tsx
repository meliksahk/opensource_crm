'use client';
// src/components/organisms/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/lib/auth';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { FormField } from '../molecules/FormField';

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@crm.dev');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push('/');
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error?.message
          ? err.response.data.error.message
          : 'Giriş başarısız';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-sm p-8">
      <h1 className="mb-1 text-xl font-semibold text-gray-900">
        Açık Kaynak CRM
      </h1>
      <p className="mb-6 text-sm text-gray-500">Hesabınızla giriş yapın</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          id="email"
          label="E-posta"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          id="password"
          label="Parola"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>
    </Card>
  );
}
