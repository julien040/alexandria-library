import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind({
    applyBaseStyles: true
  })],
  output: "hybrid",
  prefetch: true,
  adapter: node({
    mode: "standalone"
  }),
  server: {
    headers: {
      "Cache-Control": "public, max-age=604800, stale-while-revalidate=3600"
    }
  }
});