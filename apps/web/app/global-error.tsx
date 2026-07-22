'use client';

import { Box } from '@chakra-ui/react';
import { useEffect } from 'react';
import { ErrorState } from '@/components/common/error-state';
import { Providers } from './providers';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Box as="main" layerStyle="appCanvas">
            <ErrorState
              eyebrow="全局运行异常"
              title="应用暂时不可用"
              description="应用未能完成当前请求，请稍后重试。"
              message="你可以先重新加载应用；若问题持续，请记录错误标识并联系管理员。"
              digest={error.digest}
              minH="100vh"
              actions={[
                { label: '重试', onClick: reset },
                { label: '返回首页', href: '/', variant: 'outline' },
              ]}
            />
          </Box>
        </Providers>
      </body>
    </html>
  );
}
