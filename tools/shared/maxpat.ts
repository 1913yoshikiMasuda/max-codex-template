import { readFile } from "node:fs/promises";

export type Rect = [number, number, number, number];
export type Endpoint = [string, number];

export interface MaxBox {
  id?: string;
  maxclass?: string;
  text?: string;
  varname?: string;
  patching_rect?: unknown;
  presentation_rect?: unknown;
  numinlets?: number;
  numoutlets?: number;
  patcher?: MaxPatcher;
  [key: string]: unknown;
}

export interface MaxLine {
  source?: unknown;
  destination?: unknown;
  hidden?: number;
  [key: string]: unknown;
}

export interface MaxPatcher {
  boxes?: Array<{ box?: MaxBox }>;
  lines?: Array<{ patchline?: MaxLine }>;
  rect?: unknown;
  [key: string]: unknown;
}

export interface MaxpatDocument {
  patcher?: MaxPatcher;
  [key: string]: unknown;
}

export interface ParsedObject extends MaxBox {
  id: string;
  path: string;
  depth: number;
}

export interface ParsedConnection {
  source: Endpoint | null;
  destination: Endpoint | null;
  path: string;
  hidden: boolean;
}

export interface ParsedPatch {
  document: MaxpatDocument;
  objects: ParsedObject[];
  connections: ParsedConnection[];
  subpatcherCount: number;
  bpatcherCount: number;
  topLevelObjects: ParsedObject[];
  topLevelConnections: ParsedConnection[];
}

export function asRect(value: unknown): Rect | null {
  if (!Array.isArray(value) || value.length !== 4 || value.some((item) => typeof item !== "number" || !Number.isFinite(item))) return null;
  return value as Rect;
}

function asEndpoint(value: unknown): Endpoint | null {
  if (!Array.isArray(value) || value.length < 2 || typeof value[0] !== "string" || !Number.isInteger(value[1])) return null;
  return [value[0], value[1] as number];
}

export function parseDocument(document: MaxpatDocument): ParsedPatch {
  if (!document || typeof document !== "object" || !document.patcher || typeof document.patcher !== "object") {
    throw new Error("The JSON root must contain a patcher object.");
  }
  const objects: ParsedObject[] = [];
  const connections: ParsedConnection[] = [];
  let subpatcherCount = 0;

  function visit(patcher: MaxPatcher, path: string, depth: number): void {
    for (const [index, wrapper] of (patcher.boxes ?? []).entries()) {
      const box = wrapper?.box;
      if (!box || typeof box !== "object") continue;
      const id = typeof box.id === "string" ? box.id : `(missing-id-${index})`;
      const parsed: ParsedObject = { ...box, id, path, depth };
      objects.push(parsed);
      if (box.patcher && typeof box.patcher === "object") {
        subpatcherCount += 1;
        visit(box.patcher, `${path}/${id}`, depth + 1);
      }
    }
    for (const wrapper of patcher.lines ?? []) {
      const line = wrapper?.patchline;
      if (!line || typeof line !== "object") continue;
      connections.push({
        source: asEndpoint(line.source),
        destination: asEndpoint(line.destination),
        path,
        hidden: line.hidden === 1,
      });
    }
  }

  visit(document.patcher, "root", 0);
  return {
    document,
    objects,
    connections,
    subpatcherCount,
    bpatcherCount: objects.filter((object) => object.maxclass === "bpatcher").length,
    topLevelObjects: objects.filter((object) => object.depth === 0),
    topLevelConnections: connections.filter((connection) => connection.path === "root"),
  };
}

export async function readMaxpat(filePath: string): Promise<ParsedPatch> {
  let document: unknown;
  try {
    document = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${filePath} as JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return parseDocument(document as MaxpatDocument);
}

export function objectLabel(object: MaxBox): string {
  const text = typeof object.text === "string" && object.text.trim() ? ` \"${object.text}\"` : "";
  return `${object.maxclass ?? "unknown"}${text}`;
}
