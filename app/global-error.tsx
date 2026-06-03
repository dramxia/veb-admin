'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global-error]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)',
            color: '#0f172a',
          }}
        >
          <section
            style={{
              width: '100%',
              maxWidth: 560,
              borderRadius: 24,
              padding: 32,
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 18px 44px rgba(15,23,42,0.08)',
              border: '1px solid rgba(255,255,255,0.8)',
            }}
          >
            <p style={{ margin: '0 0 12px', color: '#dc2626', fontWeight: 800 }}>全局运行异常</p>
            <h1 style={{ margin: '0 0 12px', fontSize: 28, letterSpacing: '-0.04em' }}>应用暂时不可用</h1>
            <p style={{ margin: '0 0 24px', color: '#64748b', lineHeight: 1.8 }}>{error.message || '当前应用发生未知错误。'}</p>
            <button
              type="button"
              onClick={reset}
              style={{
                border: 0,
                borderRadius: 14,
                padding: '12px 18px',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #1677ff 0%, #6d5dfc 100%)',
              }}
            >
              重试
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
