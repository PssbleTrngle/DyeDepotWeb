import type { Mod, SupportedMod } from "../../src/mods";
import curseforge from "./curseforge";
import modrinth from "./modrinth";

export type ProjectProvider = {
  mod(url: string): Promise<Mod>;
  dependencies(url: string): Promise<SupportedMod[]>;
};

export function providerOf(url: string) {
  const { host, protocol } = new URL(url);

  if (protocol !== "https:") {
    throw new Error("only http is supported");
  }

  if (host === "modrinth.com") {
    return modrinth;
  }

  if (host === "curseforge.com") {
    return curseforge;
  }

  throw new Error(`cannot resolve mods at hostname '${host}'`);
}
