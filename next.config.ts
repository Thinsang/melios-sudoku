import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so turbopack doesn't pick up the parent dir's lockfile.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
