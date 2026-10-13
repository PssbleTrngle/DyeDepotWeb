import { writeFile } from "node:fs/promises";
import { join } from "node:path/posix";
import * as z from "zod";

export const modSchema = z.object({
  url: z.string(),
});

export const compatibleSchema = z.object({
  $schema: z.string().optional(),
  mods: z.array(
    modSchema.and(
      z.object({
        features: z.string().optional(),
        supports: z.literal(true).or(z.array(modSchema)).optional(),
      }),
    ),
  ),
});

export const incompatibleSchema = z.object({
  $schema: z.string().optional(),
  mods: z.array(
    modSchema.and(
      z.object({
        reason: z.string(),
        ticket: z.url().optional(),
      }),
    ),
  ),
});

async function writeSchema(name: string, schema: z.ZodType) {
  await writeFile(
    join(import.meta.dirname, "..", "schemas", name + ".json"),
    JSON.stringify(schema.toJSONSchema(), null, 2),
  );
}

export async function writeSchemas() {
  await Promise.all([
    writeSchema("compatible", compatibleSchema),
    writeSchema("incompatible", incompatibleSchema),
  ]);
}
