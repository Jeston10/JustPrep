import type { NextConfig } from "next";

// Build-time type and lint errors fail the build (GUARDRAILS B10). Security headers arrive in P1.2.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
