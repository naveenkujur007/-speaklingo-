import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove "standalone" for Vercel — Vercel handles output automatically
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
