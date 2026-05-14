import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so turbopack doesn't pick up the parent dir's lockfile.
    root: path.resolve(__dirname),
  },
  async headers() {
    return [
      {
        // Allow any site to embed Melio Games in an iframe. We don't ship
        // anything bank-or-account-sensitive that would warrant clickjacking
        // protection, and we WANT students to be able to drop the games
        // into a Google Site / Notion page / school-permitted portal.
        //
        // X-Frame-Options is the legacy header — we deliberately don't set
        // SAMEORIGIN. CSP's frame-ancestors is the modern equivalent and
        // takes precedence when both are present.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
