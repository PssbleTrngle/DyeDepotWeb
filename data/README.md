This directory contains the data files used to generate the site.

## `compatible.json`

used to generate the `/compatible` and `/compat-mods` pages.

```jsonc
{
   "url": "https://modrinth.com/mod/dye-the-world",
   // you can optionally list which dyed things are added
   // this is currently not used, but will be presented somewhere in the future
   "features": "cool blocks & items",
   // setting this to true will fetch the supported mods
   // automatically using the dependencies marked on modrinth
   "supports": true,
   // Instead you can manually specify a list of supported mods
   "supports": [
      {
         "url": "https://modrinth.com/mod/create"
      }
   ]
   // leaving it away will mark the mod as having built-in compatibilty for itself
}
```

## `incompatible.json`

used to generate the `/incompatible` page.

```jsonc
{
   "url": "https://modrinth.com/mod/dye-the-world",
   // you can optionally specify the reason why this mod is incompatible
   "reason": "cool blocks & items"
}
```