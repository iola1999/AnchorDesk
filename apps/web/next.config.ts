import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: [
    "@knowledge-assistant/auth",
    "@knowledge-assistant/db",
    "@knowledge-assistant/queue",
    "@knowledge-assistant/storage",
  ],
};

export default nextConfig;
