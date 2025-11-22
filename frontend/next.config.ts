// next.config.ts
import type { NextConfig } from 'next';
import webpack from 'webpack';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  // Explicitly configure Turbopack to be disabled
  turbopack: {
    // Empty config disables Turbopack
  },
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Ignore problematic modules
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(thread-stream|pino|pino-pretty|pino-elasticsearch|tap|tape|desm|fastbench|why-is-node-running)$/,
      })
    );

    // Handle Node.js modules in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        net: false,
        dns: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        path: require.resolve('path-browserify'),
        zlib: require.resolve('browserify-zlib'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/')
      };
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;