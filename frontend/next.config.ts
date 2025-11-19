import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Add empty turbopack config to satisfy Next.js
  turbopack: {},
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    // Exclude test files from being processed
    config.module.rules.push({
      test: /\.test\.(js|jsx|ts|tsx)$/,
      loader: 'ignore-loader'
    });

    // Exclude markdown and other non-JS files
    config.module.rules.push({
      test: /\.(md|mdx|test\.ts|test\.js|test\.mjs|test\.cjs)$/,
      loader: 'ignore-loader'
    });

    // Exclude problematic modules
    config.externals = {
      ...config.externals,
      'thread-stream': 'commonjs thread-stream',
      'pino': 'commonjs pino',
      'pino-pretty': 'commonjs pino-pretty'
    };

    return config;
  },
  // Configure page extensions to exclude test files
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  // Configure webpack to ignore specific modules
  transpilePackages: ['@walletconnect/*', 'wagmi', 'viem', '@tanstack/*']
};

// For development, use webpack
if (process.env.NODE_ENV === 'development') {
  nextConfig.webpack = (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  };
}

export default nextConfig;