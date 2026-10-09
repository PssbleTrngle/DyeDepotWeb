import type { AstroIntegration } from "astro";

const script = /* javascript */ `
 import 'htmx.org';
 import 'htmx-ext-json-enc';
`;

export default <AstroIntegration>{
  name: "htmx",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", script);
    },
  },
};
