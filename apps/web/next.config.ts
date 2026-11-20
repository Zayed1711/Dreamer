import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The journey engine is TypeScript source in packages/, and reads content/ JSON.
  transpilePackages: ["@dreamer/journey-engine"],
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
