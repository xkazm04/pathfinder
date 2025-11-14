import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Set explicit Turbopack root to silence warnings
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
