export const LOADERS = ["neoforge", "forge", "fabric"] as const;

export type Loader = (typeof LOADERS)[number];
