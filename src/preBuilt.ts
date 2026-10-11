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

const LIBRARIES: string[] = ["dye-depot", "dye-the-world"];

async function fetchSupported(url: string): Promise<SupportedMod[]> {
  const provider = providerOf(url);
  const dependencies = await provider.dependencies(url);
  return dependencies.filter((it) => {
    if (LIBRARIES.includes(it.slug)) return false;
    if (it.categories.includes("library")) return false;
    return true;
  });
}

export default async function populateData() {
  const populated = await Promise.all(
    data.map(async ({ supports, ...compat }) => {
      const [mod, connections] = await Promise.all([
        fetchMod(compat),
        supports === true
          ? fetchSupported(compat.url)
          : Promise.all(supports?.map(fetchMod) ?? []),
      ]);

      return {
        mod,
        connections,
      } satisfies ModCompat;
    }),
  );

  const dyeDepot = await fetchMod({
    url: "https://modrinth.com/mod/dye-depot",
  });

  function tidy(mod: Mod) {
    return {
      ...mod,
      minecraftVersions: mod.minecraftVersions.filter((it) =>
        dyeDepot.minecraftVersions.includes(it),
      ),
      loaders: mod.loaders.filter((it) => dyeDepot.loaders.includes(it)),
    };
  }

  const tidied = populated.map(({ mod, connections }) => ({
    mod: tidy(mod),
    connections: connections.map(tidy),
  }));

  const compatMods = tidied.filter((it) => it.connections.length > 0);

  const contentMods = tidied.flatMap<ModCompat>(({ mod, connections }) => {
    if (connections.length > 0)
      return connections.map((it) => ({ mod: it, connections: [mod] }));
    return [{ mod, connections: [] }];
  });

  const mods: Record<string, ModCompat> = {};
  contentMods.forEach(({ connections, mod }) => {
    if (mod.slug in mods) {
      mods[mod.slug].connections.push(...connections);
    } else {
      mods[mod.slug] = { mod, connections };
    }
  });

  await writeFile(
    join(import.meta.dirname, "generated.ts"),
    [
      `import type { ModCompat } from "./mods";`,
      `export const compatMods: ModCompat[] = ${JSON.stringify(
        compatMods.toSorted((a, b) => {
          const [scoreA, scoreB] = [a, b].map(
            (it) => it.mod.downloads * it.connections.length + 1,
          );

          return scoreB - scoreA;
        }),
      )};`,
      `export const mods: ModCompat[] = ${JSON.stringify(
        Object.values(mods).toSorted((a, b) => {
          return b.mod.downloads - a.mod.downloads;
        }),
        null,
        2,
      )};`,
    ].join("\n"),
  );
}

if (process.argv[1] === import.meta.filename) {
  await populateData();
  console.log("generated populated mod data");
}
