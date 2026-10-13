import CurseForgeClient from "curseforge-js";
import type { ProjectProvider } from ".";
import { LOADERS, type Loader } from "../../src/loaders";
import type { Mod, SupportedMod } from "../../src/mods";
import { userAgent } from "./common";

const client = new CurseForgeClient({
  userAgent,
  apiKey: import.meta.env.CURSEFORGE_TOKEN,
});

const gameId = 432;

const classIds: Record<string, number | undefined> = {
  "mc-mods": 6,
  "texture-packs": 12,
};

function slugOf(url: string) {
  const { pathname } = new URL(url);
  const [, type, slug] = pathname.slice(1).split("/");
  const classId = classIds[type];
  if (!classIds)
    throw new Error(`unknown curseforge project type '${type}' for '${slug}'`);
  return { slug, classId };
}

async function mod(url: string): Promise<Mod> {
  const { slug, classId } = slugOf(url);
  const response = await client.mods.search({
    gameId,
    searchFilter: slug,
    sortOrder: "desc",
    pageSize: 1,
    classId,
  });

  const [match] = response.data;

  if (match.slug !== slug) {
    throw new Error(`unable to fetch ${slug} using the search`);
  }

  const gameVersions = match.latestFiles
    .flatMap((it) => it.gameVersions)
    .map((it) => it.toLowerCase())
    .filter((v1, i1, a) => !a.some((v2, i2) => v1 === v2 && i2 < i1));

  const loaders = gameVersions.filter((it) => LOADERS.includes(it as Loader));
  const minecraftVersions = gameVersions.filter((it) => /(\d+\.)+\d+/.test(it));

  return {
    url,
    slug: match.slug,
    name: match.name,
    summary: match.summary,
    categories: match.categories.map((it) => it.slug),
    downloads: match.downloadCount,
    links: {
      curseforge: url,
      source: match.links.sourceUrl,
    },
    loaders,
    minecraftVersions,
    iconUrl: match.logo.thumbnailUrl,
  };
}

async function dependencies(_: string): Promise<SupportedMod[]> {
  throw new Error(
    "fetching dependencies not yet supported for curseforge mods",
  );
}

const curseforge: ProjectProvider = { mod, dependencies };

export default curseforge;
