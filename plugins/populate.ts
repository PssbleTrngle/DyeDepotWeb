import type { AstroIntegration } from "astro";
import populateData from "../scripts/populate";

export default (<AstroIntegration>{
  name: "populate",
  hooks: {
    "astro:config:done": async () => {
      await populateData();
    },
  },
});
