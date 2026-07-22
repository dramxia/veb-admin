import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const gatewayConfig = readFileSync(
  fileURLToPath(
    new URL('../../../../deploy/nginx/blog-public.conf', import.meta.url),
  ),
  'utf8',
);

function locationPattern(marker: string) {
  const line = gatewayConfig
    .split('\n')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`location ~ ${marker}`));
  if (!line) throw new Error(`Missing gateway location: ${marker}`);
  return new RegExp(line.slice('location ~ '.length, -' {'.length));
}

describe('Blog public gateway contract', () => {
  it('allows only public and health paths while internal routes fall through', () => {
    const publicPath = locationPattern('^/(?:api/v1/public|api/public)');
    const healthPath = locationPattern('^/api/health/');

    expect(publicPath.test('/api/v1/public/articles')).toBe(true);
    expect(publicPath.test('/api/public/tags')).toBe(true);
    expect(healthPath.test('/api/health/ready')).toBe(true);
    expect(healthPath.test('/api/health/live')).toBe(true);

    expect(publicPath.test('/api/internal/v1/articles')).toBe(false);
    expect(healthPath.test('/api/internal/v1/articles')).toBe(false);
    expect(gatewayConfig).toContain('location / {');
    expect(gatewayConfig).toContain(
      `return 404 '{"code":40401,"data":null,"message":"Not found"}';`,
    );
  });

  it('replaces spoofable forwarding headers with the gateway peer address', () => {
    expect(gatewayConfig).toContain(
      'proxy_set_header X-Forwarded-For $remote_addr;',
    );
    expect(gatewayConfig).toContain('proxy_set_header X-Real-IP $remote_addr;');
    expect(gatewayConfig).toContain('proxy_set_header CF-Connecting-IP "";');
  });
});
