import {
  AuthFeature,
  GenericModrinthClient,
  type AuthConfig,
  type Labrinth,
} from "@modrinth/api-client";
import type { ProjectProvider } from ".";
import packageJson from "../../package.json";
import type { Mod, SupportedMod } from "../mods";

const client = new GenericModrinthClient({
  userAgent: `${packageJson.name}/${packageJson.version}`,
  features: [
    new AuthFeature({ token: import.meta.env.MODRINTH_TOKEN } as AuthConfig),
  ],
});

function slugOf(url: string) {
  const { pathname } = new URL(url);
  const [, slug] = pathname.slice(1).split("/");
  return slug;
}

function toMod(project: Labrinth.Projects.v3.Project): Mod {
  const [type = "mod"] = project.project_types;
  const url = `https://modrinth.com/${type}/${project.slug}`;

  return {
    name: project.name,
    slug: project.slug ?? project.id,
    summary: project.summary,
    loaders: project.loaders,
    iconUrl: project.raw_icon_url,
    minecraftVersions: (project.game_versions as string[]).toReversed() ?? [],
    url,
    links: {
      source: project.link_urls.source?.url,
      modrinth: url,
    },
    downloads: project.downloads,
  };
}

async function mod(url: string): Promise<Mod> {
  const response = await client.labrinth.projects_v3.get(slugOf(url));
  return toMod(response);
}

async function dependencies(url: string): Promise<SupportedMod[]> {
  const response = await client.labrinth.projects_v3.getDependencies(
    slugOf(url),
  );

  return response.projects.map(toMod);
}

const modrinth: ProjectProvider = { mod, dependencies };

export default modrinth;
