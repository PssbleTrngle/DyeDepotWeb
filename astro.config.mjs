// @ts-check
import node from "@astrojs/node";
import icon from "astro-icon";
import { defineConfig, passthroughImageService } from "astro/config";
import htmx from "./plugins/htmx";

export default defineConfig({
  output: "server",
  integrations: [
    icon({
      include: {
        "simple-icons": ["git", "modrinth", "curseforge", "discord"],
      },
    }),
    htmx,
  ],
  adapter: node({
    mode: "standalone",
  }),
  image: {
    service: passthroughImageService(),
  },
});
