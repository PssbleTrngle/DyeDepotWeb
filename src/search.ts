import { invalidMethod } from "@/errors";
import type { ModCompat } from "@/mods";
import { int } from "@/number";
import type { Page } from "@/pagination";
import type { FuseOptionKeyObject, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";

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

export function searchMods<T extends ModCompat>(
  mods: T[],
  { term, loader = [], version = [], page = 1 }: SearchQuery,
): Page<WithMatches<T>> {
  function keys(prefix: string): FuseOptionKeyObject<T>[] {
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

export async function parseSearchBody(request: Request) {
  const body = (await request.json()) as SearchQuery;

  function multiSelectValue(search?: string | string[]) {
    if (!search) return [];
    if (Array.isArray(search)) return search;
    return [search];
  }

  return <SearchQuery>{
    ...body,
    loader: multiSelectValue(body.loader),
    version: multiSelectValue(body.version),
    page: int(body.page),
  };
}

export const searchForm = (url: URL, scroll = false) => {
  let endpoint = url.pathname;
  if (!endpoint.endsWith("/search")) endpoint += "/search";
  return {
    "hx-post": endpoint,
    "hx-target": "#mods",
    "hx-swap": `outerHTML ${scroll ? "show:window:top" : ""}`,
  };
};

export function setSearchUrl(
  search: SearchQuery,
  type: string,
  headers: Headers,
) {
  const params = new URLSearchParams();
  if (search.term) params.set("search", search.term);
  if (search.loader?.length) params.set("loader", search.loader.join(","));
  if (search.version?.length) params.set("version", search.version.join(","));
  if (search.page && search.page > 1)
    params.set("page", search.page.toString());

  let query = params.toString();
  if (query) query = `?${query}`;

  headers.set("HX-Push-Url", `/${type}${query}`);
}

export async function handleSearchRequest<T extends ModCompat>(
  astro: Astro,
  subjects: T[],
) {
  if (astro.request.method !== "POST") {
    invalidMethod();
  }

  const { pathname } = astro.url;
  let type = pathname.substring(1);
  type = type.substring(0, type.indexOf("/"));

  const search = await parseSearchBody(astro.request);
  setSearchUrl(search, type, astro.response.headers);
  return searchMods(subjects, search);
}
