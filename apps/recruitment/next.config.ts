import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the unified root Worker serves this app's output
  // from dist/recruitment/. API routes live in worker/index.ts.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
