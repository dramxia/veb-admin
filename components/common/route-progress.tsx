'use client';

import NProgress from 'nprogress';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

NProgress.configure({ showSpinner: false, trickleSpeed: 120 });

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleStart = (event: MouseEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      if (targetUrl.origin !== window.location.origin || anchor.target === '_blank') return;
      if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) return;

      NProgress.start();
    };

    window.addEventListener('click', handleStart, true);
    return () => window.removeEventListener('click', handleStart, true);
  }, []);

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}
