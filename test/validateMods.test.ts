import { it } from "bun:test";
import populateData from "../src/preBuilt";

it("validate mods.json", async () => {
  await populateData();
});
