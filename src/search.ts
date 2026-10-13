import type { FuseOptionKeyObject, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";
import type { ModCompat } from "./mods";
import { int } from "./number";
import type { Page } from "./pagination";

export type WithMatches<T> = T & {
  matches?: ReadonlyArray<FuseResultMatch>;
};

export type SearchQuery = {
  term: string;
  loader?: string[];
  version?: string[];
  page?: number;
};

function supports(modValues: string[], searchValues: string[]) {
  if (searchValues.length === 0) return true;
  return modValues.some((it) => searchValues.includes(it));
}

export function searchMods(
  mods: ModCompat[],
  { term, loader = [], version = [], page = 1 }: SearchQuery,
): Page<WithMatches<ModCompat>> {
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
    threshold: 0.4,
  });

  const results = fuse.search(term);

  const values = results
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

  const pageSize = 10;
  const potentialNext = page + 1;
  const potentialPrevious = page - 1;
  const sliced = values.slice(potentialPrevious * pageSize, page * pageSize);
  const lastPage = Math.ceil(values.length / pageSize);

  return {
    values: sliced,
    pagination: {
      page,
      total: values.length,
      previous: potentialPrevious > 0 ? potentialPrevious : undefined,
      next: potentialNext < lastPage ? potentialNext : undefined,
    },
  };
}

export function parseSearchQuery(url: URL): SearchQuery {
  const term = url.searchParams.get("search") ?? "";
  const loader = url.searchParams.get("loader")?.split(",");
  const version = url.searchParams.get("version")?.split(",");
  const page = int(url.searchParams.get("page"));
  return { term, loader, version, page };
}
