import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path/posix";

const out = join(import.meta.dirname, "..", "src", "generated.ts");

if (!existsSync(out)) {
  await writeFile(
    out,
    [
      "/* eslint-disable */",
      `import type { Mod, ModCompat, IncompatibleMod } from "./mods";`,
      `import type { AppInfo } from "./components/Footer.astro";`,
      `export const dyeDepot = {} as Mod`,
      "export const compatMods: ModCompat[] = []",
      "export const compatibleMods: ModCompat[] = []",
      "export const incompatibleMods: IncompatibleMod[] = []",
      `export const appInfo: AppInfo = {
        builtAt: new Date()
        };`,
    ].join("\n"),
  );
}
