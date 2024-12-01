import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  server: {
    port: parseInt(process.env.PORT) || 4321,
    host: true
  },
  output: "server",
  adapter: node({
    mode: "standalone"
  }),
  site: "https://slashexperts.com",
  integrations: [tailwind(), mdx(), sitemap(), icon()],
});
