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
    // 默认将 SVG 编译为组件；显式添加 ?url 时仍交给 Next 的静态资源规则。
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    const assetRule = config.module.rules.find(
      (rule) =>
        rule &&
        typeof rule === 'object' &&
        rule.test instanceof RegExp &&
        rule.test.test('.svg'),
    );
    const excludedQueries =
      assetRule &&
      typeof assetRule === 'object' &&
      assetRule.resourceQuery &&
      typeof assetRule.resourceQuery === 'object' &&
      'not' in assetRule.resourceQuery &&
      Array.isArray(assetRule.resourceQuery.not)
        ? assetRule.resourceQuery.not
        : [];

    if (assetRule && typeof assetRule === 'object') {
      config.module.rules.push(
        { ...assetRule, test: /\.svg$/i, resourceQuery: /url/ },
        {
          test: /\.svg$/i,
          issuer: assetRule.issuer,
          resourceQuery: { not: [...excludedQueries, /url/] },
          use: ['@svgr/webpack'],
        },
      );
      assetRule.exclude = /\.svg$/i;
    } else {
      config.module.rules.push({
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: ['@svgr/webpack'],
      });
    }

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
