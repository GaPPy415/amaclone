import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
    devIndicators: false,
	outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client/**"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
