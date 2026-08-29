import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, relative, resolve, sep } from "node:path";

export interface MaxProjectEntryMetadata {
  kind?: string;
  local?: number;
  toplevel?: number;
  [key: string]: unknown;
}

export interface MaxProjectDocument {
  name?: string;
  version?: number;
  autoorganize?: number;
  showdependencies?: number;
  contents?: Record<string, unknown>;
  searchpath?: unknown;
  [key: string]: unknown;
}

export interface MaxProjectEntry {
  category: string;
  name: string;
  metadata: MaxProjectEntryMetadata;
}

export interface ResolvedMaxProjectEntry extends MaxProjectEntry {
  candidates: string[];
  resolvedPath: string | null;
  status: "resolved" | "missing" | "ambiguous" | "global";
}

export interface ResolvedMaxProject {
  document: MaxProjectDocument;
  projectPath: string;
  root: string;
  entries: ResolvedMaxProjectEntry[];
  searchPaths: Array<{ name: string; value: unknown }>;
}

const ignoredDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const normalizePath = (value: string): string => value.split(sep).join("/");

export function parseMaxProject(document: MaxProjectDocument): {
  entries: MaxProjectEntry[];
  searchPaths: Array<{ name: string; value: unknown }>;
} {
  if (!document || typeof document !== "object") throw new Error("The .maxproj JSON root must be an object.");
  const entries: MaxProjectEntry[] = [];
  if (document.contents && typeof document.contents === "object" && !Array.isArray(document.contents)) {
    for (const [category, rawItems] of Object.entries(document.contents)) {
      if (!rawItems || typeof rawItems !== "object" || Array.isArray(rawItems)) continue;
      for (const [name, rawMetadata] of Object.entries(rawItems)) {
        const metadata = rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
          ? rawMetadata as MaxProjectEntryMetadata
          : {};
        entries.push({ category, name, metadata });
      }
    }
  }
  const searchPaths = document.searchpath && typeof document.searchpath === "object" && !Array.isArray(document.searchpath)
    ? Object.entries(document.searchpath as Record<string, unknown>).map(([name, value]) => ({ name, value }))
    : [];
  return { entries, searchPaths };
}

async function walk(root: string, directory: string, output: string[]): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(root, absolutePath, output);
    else output.push(normalizePath(relative(root, absolutePath)));
  }
}

function chooseCandidate(entry: MaxProjectEntry, files: string[]): Pick<ResolvedMaxProjectEntry, "candidates" | "resolvedPath" | "status"> {
  const normalizedName = normalizePath(entry.name);
  const entryBasename = basename(normalizedName);
  const preferredPaths = [normalizePath(`${entry.category}/${normalizedName}`), normalizedName];
  const candidates = files.filter((file) => preferredPaths.includes(file) || basename(file) === entryBasename);
  const preferred = preferredPaths
    .filter((path) => candidates.includes(path));
  if (preferred.length > 0) return { candidates, resolvedPath: preferred[0] ?? null, status: "resolved" };
  if (candidates.length === 1) return { candidates, resolvedPath: candidates[0] ?? null, status: "resolved" };
  if (candidates.length > 1) return { candidates, resolvedPath: null, status: "ambiguous" };
  if (entry.metadata.local === 0) return { candidates, resolvedPath: null, status: "global" };
  return { candidates, resolvedPath: null, status: "missing" };
}

export async function readMaxProject(projectPath: string): Promise<ResolvedMaxProject> {
  const absoluteProjectPath = resolve(projectPath);
  let document: unknown;
  try {
    document = JSON.parse(await readFile(absoluteProjectPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${absoluteProjectPath} as .maxproj JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  const root = dirname(absoluteProjectPath);
  const parsed = parseMaxProject(document as MaxProjectDocument);
  const files: string[] = [];
  await walk(root, root, files);
  return {
    document: document as MaxProjectDocument,
    projectPath: absoluteProjectPath,
    root,
    entries: parsed.entries.map((entry) => ({ ...entry, ...chooseCandidate(entry, files) })),
    searchPaths: parsed.searchPaths
  };
}
