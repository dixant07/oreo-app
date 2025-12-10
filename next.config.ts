import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone', // Required for Docker deployment

  // Ensure static files in public folder are properly served
  // This includes games in /public/games/*
  async headers() {
    return [
      {
        // Apply to all static game files
        source: '/games/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
