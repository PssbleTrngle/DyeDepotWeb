import { it } from "bun:test";
import populateData from "../scripts/populate";

it("validate mods.json", async () => {
  await populateData();
});
