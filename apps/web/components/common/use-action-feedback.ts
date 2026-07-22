'use client';

import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

type RunOptions = {
  successTitle?: string;
  errorTitle?: string;
  refresh?: boolean;
};

export function getErrorMessage(error: unknown, fallback = '操作失败') {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useActionFeedback(defaultOptions: RunOptions = {}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<void> | void, options: RunOptions = {}) => {
      const merged = {
        successTitle: '操作成功',
        errorTitle: '操作失败',
        refresh: false,
        ...defaultOptions,
        ...options,
      };
      setError(null);
      setLoading(true);
      try {
        await action();
        if (merged.successTitle) {
          toast({ title: merged.successTitle, status: 'success' });
        }
        if (merged.refresh) router.refresh();
        return true;
      } catch (error) {
        const message = getErrorMessage(error, merged.errorTitle);
        setError(message);
        toast({ title: message, status: 'error' });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [defaultOptions, router, toast],
  );

  const clearError = useCallback(() => setError(null), []);

  return { clearError, error, loading, run };
}
