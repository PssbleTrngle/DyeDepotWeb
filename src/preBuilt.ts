import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";
import rawData from "../mods.json";
import type { Mod, ModCompat, SupportedMod } from "./mods";
import { providerOf } from "./providers";

const modSchema = z.object({
  url: z.string(),
});
const schema = z.array(
  modSchema.and(
    z.object({
      supports: z.literal(true).or(z.array(modSchema)).optional(),
    }),
  ),
);

const data = schema.parse(rawData);

async function fetchMod<T extends { url: string }>(mod: T): Promise<T & Mod> {
  const provider = providerOf(mod.url);
  const fetched = await provider.mod(mod.url);
  return { ...mod, ...fetched };
}

async function fetchSupported(url: string): Promise<SupportedMod[]> {
  const provider = providerOf(url);
  const dependencies = await provider.dependencies(url);
  return dependencies.filter((it) => {
    if (it.slug === "dye-depot") return false;
    if (it.slug === "dye-the-world") return false;
    if (it.slug === "fabric-api") return false;
    return true;
  });
}

export default async function populateData() {
  const populated = await Promise.all(
    data.map(async ({ supports: supportsInput, ...compat }) => {
      const [mod, supports] = await Promise.all([
        fetchMod(compat),
        supportsInput === true
          ? fetchSupported(compat.url)
          : Promise.all(supportsInput?.map(fetchMod) ?? []),
      ]);

      return {
        mod,
        supports,
      } satisfies ModCompat;
    }),
  );

  const sorted = populated.toSorted((a, b) => {
    const [scoreA, scoreB] = [a, b].map(
      (it) => it.mod.downloads * it.supports.length + 1,
    );

    return scoreB - scoreA;
  });

  await writeFile(
    join(import.meta.dirname, "generated.ts"),
    [
      `import type { ModCompat } from "./mods";`,
      `export const mods: ModCompat[] = ${JSON.stringify(sorted, null, 2)};`,
    ].join("\n"),
  );
}
