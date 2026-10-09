// @ts-check
import { defineConfig } from "astro/config";

import icon from "astro-icon";
import populateData from "./src/preBuilt";

export default defineConfig({
  integrations: [
    icon(),
    {
      name: "internal",
      hooks: {
        "astro:config:done": async () => {
          await populateData();
        },
      },
    },
  ],
});
