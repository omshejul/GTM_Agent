import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import path from "node:path";

const config: NextConfig = {
  transpilePackages: ["@ai-gtm/contracts"],
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
};

initOpenNextCloudflareForDev();

export default config;
