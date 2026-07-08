import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@mappedin/react-sdk", "@mappedin/mappedin-js"],
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Lets `next dev` talk to your Cloudflare bindings (D1/KV/R2/etc.)
// when you eventually add them. Safe to leave in even with none configured yet.
initOpenNextCloudflareForDev();

export default nextConfig;
