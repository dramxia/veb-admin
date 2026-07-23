import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Xray } from '@stinsky/xray';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'VEB 工作台',
    template: '%s | VEB 工作台',
  },
  description: 'VEB 模块化工作台',
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
