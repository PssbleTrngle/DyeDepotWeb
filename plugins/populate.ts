import type { AstroIntegration } from "astro";
import populateData from "../src/preBuilt";

export default <AstroIntegration>{
  name: "populate",
  hooks: {
    "astro:config:done": async () => {
      await populateData();
    },
  },
};
