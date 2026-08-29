import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

export interface MaxToolingConfig {
  maxProjects?: string[];
  patches: string[];
  exclude?: string[];
  lintBaseline?: string;
}

export interface ProjectPatch {
  absolutePath: string;
  relativePath: string;
}

export interface ResolvedProjectConfig {
  config: MaxToolingConfig;
  configPath: string;
  root: string;
  maxProjects: ProjectPatch[];
  patches: ProjectPatch[];
  lintBaselinePath: string;
}

const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);

const normalizePath = (value: string): string => value.split(sep).join("/").replace(/^\.\//, "");

export function globToRegExp(pattern: string): RegExp {
  const normalized = normalizePath(pattern);
  let source = "^";
  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index];
    if (character === "*" && normalized[index + 1] === "*") {
      index += 1;
      if (normalized[index + 1] === "/") {
        index += 1;
        source += "(?:.*/)?";
      } else {
        source += ".*";
      }
    } else if (character === "*") {
      source += "[^/]*";
    } else if (character === "?") {
      source += "[^/]";
    } else {
      source += character?.replace(/[\\^$+?.()|{}\[\]]/g, "\\$&") ?? "";
    }
  }
  return new RegExp(`${source}$`);
}

async function walk(root: string, directory: string, output: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(root, absolutePath, output);
    } else {
      output.push(normalizePath(relative(root, absolutePath)));
    }
  }
}

function validateConfig(value: unknown): MaxToolingConfig {
  if (!value || typeof value !== "object") throw new Error("Max tooling config must be a JSON object.");
  const candidate = value as Partial<MaxToolingConfig>;
  if (!Array.isArray(candidate.patches) || candidate.patches.length === 0 || candidate.patches.some((item) => typeof item !== "string" || !item.trim())) {
    throw new Error("Max tooling config must contain a non-empty patches string array.");
  }
  if (candidate.maxProjects !== undefined && (!Array.isArray(candidate.maxProjects) || candidate.maxProjects.some((item) => typeof item !== "string" || !item.trim()))) {
    throw new Error("Max tooling config maxProjects must be a string array when provided.");
  }
  if (candidate.exclude !== undefined && (!Array.isArray(candidate.exclude) || candidate.exclude.some((item) => typeof item !== "string"))) {
    throw new Error("Max tooling config exclude must be a string array when provided.");
  }
  if (candidate.lintBaseline !== undefined && typeof candidate.lintBaseline !== "string") {
    throw new Error("Max tooling config lintBaseline must be a string when provided.");
  }
  return candidate as MaxToolingConfig;
}

export async function readProjectConfig(configArgument = "max-tooling.config.json"): Promise<ResolvedProjectConfig> {
  const configPath = resolve(configArgument);
  const root = dirname(configPath);
  const config = validateConfig(JSON.parse(await readFile(configPath, "utf8")) as unknown);
  const includes = config.patches.map(globToRegExp);
  const projectIncludes = (config.maxProjects ?? []).map(globToRegExp);
  const excludes = (config.exclude ?? []).map(globToRegExp);
  const files: string[] = [];
  await walk(root, root, files);
  const relativePaths = files
    .filter((file) => file.toLowerCase().endsWith(".maxpat"))
    .filter((file) => includes.some((pattern) => pattern.test(file)))
    .filter((file) => !excludes.some((pattern) => pattern.test(file)))
    .sort((a, b) => a.localeCompare(b));
  const maxProjectPaths = files
    .filter((file) => file.toLowerCase().endsWith(".maxproj"))
    .filter((file) => projectIncludes.some((pattern) => pattern.test(file)))
    .filter((file) => !excludes.some((pattern) => pattern.test(file)))
    .sort((a, b) => a.localeCompare(b));
  if (relativePaths.length === 0) {
    throw new Error(`No .maxpat files matched ${config.patches.join(", ")} from ${configPath}`);
  }
  if (projectIncludes.length > 0 && maxProjectPaths.length === 0) {
    throw new Error(`No .maxproj files matched ${config.maxProjects?.join(", ")} from ${configPath}`);
  }
  return {
    config,
    configPath,
    root,
    maxProjects: maxProjectPaths.map((relativePath) => ({
      relativePath,
      absolutePath: resolve(root, relativePath)
    })),
    patches: relativePaths.map((relativePath) => ({
      relativePath,
      absolutePath: resolve(root, relativePath)
    })),
    lintBaselinePath: resolve(root, config.lintBaseline ?? "maxpat-lint-baseline.json")
  };
}

export function configArgument(args: string[]): string {
  const index = args.indexOf("--config");
  if (index === -1) return "max-tooling.config.json";
  const value = args[index + 1];
  if (!value) throw new Error("--config requires a file path.");
  return value;
}
