// @ts-check
import node from "@astrojs/node";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import htmx from "./plugins/htmx";
import populate from "./plugins/populate";

export default defineConfig({
  output: "server",
  integrations: [icon(), htmx, populate],
  adapter: node({
    mode: "standalone",
  }),
});
