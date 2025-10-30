import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      "pdf-parse",
      "canvas",
      "@napi-rs/canvas",
    ],
  },
};

export default nextConfig;
