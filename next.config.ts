import type { NextConfig } from "next";

const fitMatchApiUrl = process.env.FITMATCH_API_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${fitMatchApiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
