import { writeFile } from "node:fs/promises";
import { join } from "node:path/posix";

await writeFile(
  join(import.meta.dirname, "..", "src", "generated.ts"),
  [
    `import type { Mod, ModCompat } from "./mods";`,
    `import type { AppInfo } from "./components/Footer.astro";`,
    `export const dyeDepot = {} as Mod`,
    "export const compatMods: ModCompat[] = []",
    "export const compatibleMods: ModCompat[] = []",
    "export const incompatibleMods: ModCompat[] = []",
    `export const appInfo: AppInfo = {
        builtAt: new Date()
      };`,
  ].join("\n"),
);
