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
