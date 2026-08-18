export const dynamic = 'force-dynamic';

import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { AdminShell } from '@/components/layout/admin-shell';
import { normalizePathname } from '@/components/layout/app-modules';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = normalizePathname(headers().get('x-veb-pathname') ?? '');
  if (pathname === '/admin') return children;

  return <AdminShell>{children}</AdminShell>;
}
