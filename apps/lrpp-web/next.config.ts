import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Silence monorepo lockfile warning by pointing to workspace root
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
};

export default nextConfig;
