import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained production server (server.js + traced node_modules)
  // so the Docker runtime image stays small and runs without npm.
  output: "standalone",
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
