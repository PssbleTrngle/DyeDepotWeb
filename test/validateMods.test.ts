import { it } from "bun:test";
import { loadData } from "../scripts/data";
import { providerOf } from "../scripts/providers";

it("validate data", () => {
  const { compatible, incompatible } = loadData();

  compatible.mods.forEach((it) => {
    providerOf(it.url);
  });

  incompatible.mods.forEach((it) => {
    providerOf(it.url);
  });
});
