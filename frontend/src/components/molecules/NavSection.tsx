'use client';
// src/components/molecules/NavSection.tsx — sidebar başlıklı grup.
// İçindeki tüm öğeler izinle gizlenirse (children = false/null) başlık da gösterilmez.
import { Children, ReactNode } from 'react';

export function NavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const visible = Children.toArray(children).length; // false/null elenir
  if (visible === 0) return null;
  return (
    <div className="pt-3 first:pt-0">
      <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
