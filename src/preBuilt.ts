import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { join } from "node:path/posix";
import * as z from "zod";
import compatibleData from "../data/compatible.json";
import incompatibleData from "../data/incompatible.json";
import type { Mod, ModCompat, SupportedMod } from "./mods";
import { providerOf } from "./providers";

const modSchema = z.object({
  url: z.string(),
});

const compatibleSchema = z.array(
  modSchema.and(
    z.object({
      features: z.string().optional(),
      supports: z.literal(true).or(z.array(modSchema)).optional(),
    }),
  ),
);

const incompatibleSchema = z.array(
  modSchema.and(
    z.object({
      reason: z.string(),
    }),
  ),
);

const compatible = compatibleSchema.parse(compatibleData);
const incompatible = incompatibleSchema.parse(incompatibleData);

async function fetchMod<T extends { url: string }>(mod: T): Promise<Mod> {
  const provider = providerOf(mod.url);
  const fetched = await provider.mod(mod.url);
  const assets = await downloadAssets(fetched);
  return { ...fetched, ...assets };
}

const LIBRARIES: string[] = ["dye-depot", "dye-the-world"];

async function fetchSupported(url: string): Promise<SupportedMod[]> {
  const provider = providerOf(url);
  const dependencies = await provider.dependencies(url);
  const filtered = dependencies.filter((it) => {
    if (LIBRARIES.includes(it.slug)) return false;
    if (it.categories.includes("library")) return false;
    return true;
  });

  return Promise.all(
    filtered.map(async (mod) => {
      const assets = await downloadAssets(mod);
      return { ...mod, ...assets };
    }),
  );
}

function pin(mod: Mod, references: Mod[]): Mod {
  return {
    ...mod,
    minecraftVersions: mod.minecraftVersions.filter((it) =>
      references.some((reference) => reference.minecraftVersions.includes(it)),
    ),
    loaders: mod.loaders.filter((it) =>
      references.some((reference) => reference.loaders.includes(it)),
    ),
  };
}

async function downloadAssets(mod: Mod): Promise<Partial<Mod>> {
  let iconUrl: string | undefined = undefined;

  if (mod.iconUrl) {
    const extension = extname(mod.iconUrl);
    const localUrl = join("icons", mod.slug + extension);
    const localIcon = join(import.meta.dirname, "..", "public", localUrl);

    if (!existsSync(localIcon)) {
      console.log(`downloading ${mod.iconUrl}...`);
      const response = await fetch(mod.iconUrl);
      await Bun.write(localIcon, response, {
        createPath: true,
      });
    }

    iconUrl = `/${localUrl}`;
  }

  return {
    iconUrl,
  };
}

export default async function populateData() {
  const populated = await Promise.all(
    compatible.map(async ({ supports, features, ...compat }) => {
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

  const compatMods = populated.filter((it) => it.connections.length > 0);

  const contentMods = populated.flatMap<ModCompat>(
    ({ mod, connections, ...rest }) => {
      if (connections.length > 0)
        return connections.map((it) => ({ mod: it, connections: [mod] }));
      return [{ mod, connections: [], ...rest }];
    },
  );

  const mods: Record<string, ModCompat> = {};
  contentMods.forEach(({ connections, mod, ...rest }) => {
    if (mod.slug in mods) {
      mods[mod.slug].connections.push(...connections);
    } else {
      mods[mod.slug] = { mod, connections, ...rest };
    }
  });

  for (const [slug, { mod, connections }] of Object.entries(mods)) {
    mods[slug].mod = pin(mod, connections.length ? connections : [dyeDepot]);
  }

  const incompatiblities = await Promise.all(
    incompatible.map(async (it) => {
      const mod = await fetchMod(it);
      return {
        mod,
        description: it.reason,
        connections: [],
      } satisfies ModCompat;
    }),
  );

  await writeFile(
    join(import.meta.dirname, "generated.ts"),
    [
      `import type { Mod, ModCompat } from "./mods";`,
      `import type { AppInfo } from "./components/Footer.astro";`,
      `export const compatMods: ModCompat[] = ${JSON.stringify(
        compatMods.toSorted((a, b) => {
          const [scoreA, scoreB] = [a, b].map(
            (it) => it.mod.downloads * it.connections.length + 1,
          );

          return scoreB - scoreA;
        }),
      )};`,
      `export const compatibleMods: ModCompat[] = ${JSON.stringify(
        Object.values(mods).toSorted((a, b) => {
          return b.mod.downloads - a.mod.downloads;
        }),
      )};`,
      `export const dyeDepot: Mod = ${JSON.stringify(dyeDepot)};`,
      `export const incompatibleMods: ModCompat[] = ${JSON.stringify(incompatiblities)};`,
      `export const appInfo: AppInfo = {
        builtAt: new Date(${Date.now()}),
        repository: "${import.meta.env.GIT_REPOSITORY ?? ""}",
        branch: "${import.meta.env.GIT_BRANCH ?? ""}",
        commit: "${import.meta.env.GIT_COMMIT ?? ""}",
        discordLink: "${import.meta.env.DISCORD_INVITE_URL ?? ""}",
      };`,
    ].join("\n"),
  );
}

if (process.argv[1] === import.meta.filename) {
  await populateData();
  console.log("generated populated mod data");
}
