/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: new URL('../..', import.meta.url).pathname,
  },
  transpilePackages: ['@veb/api-contracts', '@veb/api-kit', '@veb/service-auth'],
};

export default nextConfig;
