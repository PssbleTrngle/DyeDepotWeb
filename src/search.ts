import type { FuseOptionKeyObject, FuseResultMatch } from "fuse.js";
import Fuse from "fuse.js";
import { mods } from "./generated";
import type { ModCompat } from "./mods";

export type WithMatches<T> = T & {
  matches?: ReadonlyArray<FuseResultMatch>;
};

export function searchMods(term: string): WithMatches<ModCompat>[] {
  function keys(prefix: string): FuseOptionKeyObject<ModCompat>[] {
    return [
      { name: `${prefix}.name` },
      { name: `${prefix}.slug` },
      { name: `${prefix}.summary`, weight: 0.1 },
    ];
  }

  const fuse = new Fuse(mods, {
    keys: [...keys("mod"), ...keys("supports")],
    includeScore: true,
    includeMatches: true,
    shouldSort: false,
    threshold: 0.4,
  });

  const results = fuse.search(term);
  return results.map((it) => ({
    ...it.item,
    matches: it.matches ?? [],
  }));
}
