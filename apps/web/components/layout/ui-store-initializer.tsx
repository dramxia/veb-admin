'use client';

import type { ReactNode } from 'react';
import { useEffect, useLayoutEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function UiStoreInitializer({ children }: { children: ReactNode }) {
  useIsomorphicLayoutEffect(() => {
    void useUiStore.persist.rehydrate();
  }, []);

  return <>{children}</>;
}
