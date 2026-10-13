import compatibleData from "../data/compatible.json";
import incompatibleData from "../data/incompatible.json";
import { compatibleSchema, incompatibleSchema } from "./schemas";

export function loadData() {
  const compatible = compatibleSchema.parse(compatibleData);
  const incompatible = incompatibleSchema.parse(incompatibleData);
  return { compatible, incompatible };
}
