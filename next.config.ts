import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Codex and the in-app preview commonly open the local dev server through
  // 127.0.0.1 while Next advertises localhost. Keep hydration/HMR available
  // on that same-machine preview origin.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
