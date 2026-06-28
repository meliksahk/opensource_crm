'use client';
// src/components/organisms/Topbar.tsx
import { useAuth } from '@/lib/auth';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';

export function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{user?.email}</span>
        {user?.roles.map((r) => (
          <Badge key={r} tone="indigo">
            {r}
          </Badge>
        ))}
      </div>
      <Button variant="secondary" onClick={() => void logout()}>
        Çıkış
      </Button>
    </header>
  );
}
