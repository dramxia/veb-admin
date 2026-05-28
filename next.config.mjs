import { xrayPlugin } from '@stinsky/xray/plugin';

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (isDev) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        xrayPlugin({
          bundler: 'webpack',
          editor: 'code'
        })
      );
    }

    return config;
  }
};

export default nextConfig;
