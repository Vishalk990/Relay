import type { NextConfig } from "next";
import { BACKEND_URL } from "./app/config";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // 1) auth lives at the ROOT on the backend → strip /api
      { source: "/api/auth/:path*", destination: `${BACKEND_URL}/auth/:path*` },
      // 2) everything else under /api → keep /api (matches your backend group)
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
    ];
  },
};
export default nextConfig;
