import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      // 1) auth lives at the ROOT on the backend → strip /api
      { source: "/api/auth/:path*", destination: "http://localhost:8080/auth/:path*" },
      // 2) everything else under /api → keep /api (matches your backend group)
      { source: "/api/:path*", destination: "http://localhost:8080/api/:path*" },
    ];
  },
};
export default nextConfig;
