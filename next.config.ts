import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Share images read fonts and photos from disk at request time.
  outputFileTracingIncludes: {
    '/api/og/**': ['./src/assets/**/*'],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
