/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  },
  transpilePackages: ['@veb/api-contracts'],
};

export default nextConfig;
