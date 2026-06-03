'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/error-state';

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[root-error]', error);
  }, [error]);

  return (
    <ErrorState
      minH="100vh"
      eyebrow="页面出错了"
      title="运行异常"
      description="请先重试，若仍失败再返回首页。"
      message={error.message || '当前页面发生未知错误。'}
      digest={error.digest}
      actions={[
        { label: '重试', onClick: reset },
        { label: '返回首页', href: '/', variant: 'outline' },
      ]}
    />
  );
}
