import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  env: {
    NEXT_PUBLIC_CASELLA_ENV: process.env.CASELLA_ENV ?? "local",
  },
};

export default nextConfig;
