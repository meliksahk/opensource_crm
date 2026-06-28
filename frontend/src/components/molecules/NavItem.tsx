'use client';
// src/components/molecules/NavItem.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavItem({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-brand-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
