import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
    ],
  },
  // Skip TypeScript errors in preview builds
  typescript: {
    ignoreBuildErrors: process.env.SKIP_TS_CHECK === 'true',
  },
};

export default nextConfig;
