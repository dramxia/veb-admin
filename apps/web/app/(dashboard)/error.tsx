'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/common/error-state';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard-error]', error);
  }, [error]);

  return (
    <ErrorState
      eyebrow="当前模块加载失败"
      title="不要重启，先尝试恢复"
      description="可能是服务异常、权限配置异常或动态模块配置错误。"
      message={error.message || '模块渲染时发生未知错误。'}
      digest={error.digest}
      actions={[
        { label: '重新加载模块', onClick: reset },
        { label: '返回仪表盘', href: '/', variant: 'outline' },
      ]}
    />
  );
}
