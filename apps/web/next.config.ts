import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const config: NextConfig = { transpilePackages: ["@ai-gtm/contracts"] };

initOpenNextCloudflareForDev();

export default config;
