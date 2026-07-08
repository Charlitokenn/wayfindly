import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mappedin/react-sdk", "@mappedin/mappedin-js"],
};

export default nextConfig;
