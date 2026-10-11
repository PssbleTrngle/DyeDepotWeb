import type { FuseOptionKeyObject, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";
import type { ModCompat } from "./mods";

export type WithMatches<T> = T & {
  matches?: ReadonlyArray<FuseResultMatch>;
};

export type SearchQuery = {
  term: string;
  loader?: string[];
  version?: string[];
};

function supports(modValues: string[], searchValues: string[]) {
  if (searchValues.length === 0) return true;
  return modValues.some((it) => searchValues.includes(it));
}

export function searchMods(
  mods: ModCompat[],
  { term, loader = [], version = [] }: SearchQuery,
): WithMatches<ModCompat>[] {
  function keys(prefix: string): FuseOptionKeyObject<ModCompat>[] {
    return [
      { name: `${prefix}.name` },
      { name: `${prefix}.slug` },
      { name: `${prefix}.summary`, weight: 0.1 },
    ];
  }

  const fuse = new Fuse(mods, {
    keys: [...keys("mod"), ...keys("connections")],
    includeScore: true,
    includeMatches: true,
    shouldSort: false,
    threshold: 0.4,
  });

  const results = fuse.search(term);

  return results
    .map((it) => ({
      ...it.item,
      matches: it.matches ?? [],
    }))
    .filter(({ mod }) => {
      return (
        supports(mod.loaders, loader) &&
        supports(mod.minecraftVersions, version)
      );
    });
}

export function parseSearchQuery(url: URL): SearchQuery {
  const term = url.searchParams.get("search") ?? "";
  const loader = url.searchParams.get("loader")?.split(",");
  const version = url.searchParams.get("version")?.split(",");
  return { term, loader, version };
}
