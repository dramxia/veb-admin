import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Xray } from '@stinsky/xray';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'VEB 管理后台',
  description: '通用后台管理系统模板',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'development' ? <Xray /> : null}
      </body>
    </html>
  );
}
