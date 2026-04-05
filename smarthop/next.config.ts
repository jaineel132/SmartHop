import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEV_SESSION_ID: Date.now().toString(),
  },
  images: { 
    remotePatterns: [{ protocol:'https', hostname:'**' }] 
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  turbopack: {
    root: path.resolve("."),
    resolveAlias: {
      'fs': './lib/empty.ts'
    }
  }
};

export default nextConfig;
