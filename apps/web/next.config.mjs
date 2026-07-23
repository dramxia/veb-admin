import path from 'node:path';
import { fileURLToPath } from 'node:url';

const isDev = process.env.NODE_ENV === 'development';
const xrayPlugin = isDev
  ? (await import('@stinsky/xray/plugin')).xrayPlugin
  : null;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(appDirectory, '../..'),
  },
  transpilePackages: ['@veb/api-contracts'],
  async redirects() {
    return [
      {
        source: '/',
        destination: '/admin',
        permanent: false,
      },
      {
        source: '/system/:path*',
        destination: '/admin/system/:path*',
        permanent: true,
      },
      {
        source: '/content/:path*',
        destination: '/admin/content/:path*',
        permanent: true,
      },
      {
        source: '/profile',
        destination: '/admin/profile',
        permanent: true,
      },
    ];
  },
  webpack(config) {
    if (xrayPlugin) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        xrayPlugin({
          bundler: 'webpack',
          editor: 'code',
        }),
      );
    }

    return config;
  },
};

export default nextConfig;
