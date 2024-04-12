import { defineConfig } from 'astro/config';

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  server: {
    port: parseInt(process.env.PORT) || 4321,
    host: true
  },
  output: "server",
  adapter: node({
    mode: "standalone"
  })
});