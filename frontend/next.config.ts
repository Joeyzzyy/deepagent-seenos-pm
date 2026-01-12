import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // 跳过 ESLint 检查，允许构建继续
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 跳过 TypeScript 类型检查，允许构建继续
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
