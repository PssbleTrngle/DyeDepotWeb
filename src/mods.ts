export type Mod = {
  name: string;
  slug: string;
  url: string;
  summary: string;
  loaders: string[];
  iconUrl?: string;
  minecraftVersions: string[];
  links: {
    source?: string;
    modrinth?: string;
    curseforge?: string;
  };
  downloads: number;
  categories: string[];
};

export type SupportedMod = Mod & {
  version?: string;
};

export type ModCompat = {
  mod: Mod;
  description?: string;
  connections: SupportedMod[];
};
