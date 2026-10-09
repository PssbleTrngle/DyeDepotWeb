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
  };
};

export type SupportedMod = Mod & {
  version?: string;
};

export type ModCompat = {
  mod: Mod;
  supports: SupportedMod[];
};
