import { access, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";

export interface SearchSource {
  label: "MAX_HOME" | "C74" | "USER PACKAGE";
  root: string;
}

export interface HelpMatch {
  objectName: string;
  path: string;
  type: "help" | "tutorial" | "example" | "reference" | "patcher";
  relevance: number;
  source: SearchSource["label"];
}

export function candidateSources(options: { maxHome?: string; userHome?: string } = {}): SearchSource[] {
  const userHome = options.userHome ?? homedir();
  const candidates: SearchSource[] = [
    ...(options.maxHome ? [{ label: "MAX_HOME" as const, root: options.maxHome }] : []),
    { label: "C74", root: "/Applications/Max.app" },
    { label: "C74", root: join(userHome, "Applications", "Max.app") },
    { label: "USER PACKAGE", root: join(userHome, "Documents", "Max 9", "Packages") },
  ];
  const seen = new Set<string>();
  return candidates
    .map((source) => ({
      ...source,
      root: resolve(source.root.endsWith(".app") ? join(source.root, "Contents", "Resources", "C74") : source.root),
    }))
    .filter((source) => {
      if (seen.has(source.root)) return false;
      seen.add(source.root);
      return true;
    });
}

async function exists(path: string): Promise<boolean> {
  try { await access(path); return true; } catch { return false; }
}

export async function availableSources(candidates: SearchSource[]): Promise<SearchSource[]> {
  const available: SearchSource[] = [];
  for (const source of candidates) if (await exists(source.root)) available.push(source);
  return available;
}

async function walk(root: string, output: string[]): Promise<void> {
  let entries;
  try { entries = await readdir(root, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) await walk(path, output);
    else if (/\.(maxhelp|maxpat)$/i.test(entry.name) || /\.maxref\.xml$/i.test(entry.name)) output.push(path);
  }
}

function fileIdentity(path: string): { stem: string; type: HelpMatch["type"] } {
  const file = basename(path);
  const lowerPath = path.toLowerCase();
  if (/\.maxhelp$/i.test(file)) return { stem: file.slice(0, -8).toLowerCase(), type: "help" };
  if (/\.maxref\.xml$/i.test(file)) return { stem: file.slice(0, -11).toLowerCase(), type: "reference" };
  return {
    stem: file.slice(0, -7).toLowerCase(),
    type: lowerPath.includes("tutorial") ? "tutorial" : lowerPath.includes("example") ? "example" : "patcher",
  };
}

export async function searchSources(query: string, sources: SearchSource[]): Promise<HelpMatch[]> {
  const normalized = query.trim().toLowerCase();
  const matches: HelpMatch[] = [];
  for (const source of sources) {
    const files: string[] = [];
    await walk(source.root, files);
    for (const path of files) {
      const { stem, type } = fileIdentity(path);
      const lowerPath = path.toLowerCase();
      let relevance = 0;
      if (stem === normalized) relevance = 100;
      else if (stem.startsWith(normalized)) relevance = 85;
      else if (stem.includes(normalized)) relevance = 70;
      else if (lowerPath.includes(`/${normalized}/`) || lowerPath.includes(normalized)) relevance = 40;
      if (relevance) matches.push({ objectName: stem, path, type, relevance, source: source.label });
    }
  }
  return matches.sort((a, b) => b.relevance - a.relevance || a.path.localeCompare(b.path));
}
