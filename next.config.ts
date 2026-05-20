import type { NextConfig } from "next";

const imagekitHost = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
  ? new URL(process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT).hostname
  : "ik.imagekit.io";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: imagekitHost },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async rewrites() {
    return [{ source: "/docs", destination: "/docs.html" }];
  },
};

export default nextConfig;
