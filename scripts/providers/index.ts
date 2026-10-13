import type { Mod, SupportedMod } from "@/mods";
import curseforge from "./curseforge";
import modrinth from "./modrinth";

export type ProjectProvider = {
  mod(url: string): Promise<Mod>;
  dependencies(url: string): Promise<SupportedMod[]>;
};

export function providerOf(url: string) {
  const { host, protocol } = new URL(url);
  const withoutWWW = host.startsWith("www.") ? host.substring(4) : host;

  if (protocol !== "https:") {
    throw new Error("only http is supported");
  }

  if (withoutWWW === "modrinth.com") {
    return modrinth;
  }

  if (withoutWWW === "curseforge.com") {
    return curseforge;
  }

  throw new Error(`cannot resolve mods at hostname '${host}'`);
}
