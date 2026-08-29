import { asRect, objectLabel, type ParsedObject, type ParsedPatch, type Rect } from "../shared/maxpat.js";
import { lintConfig } from "./config.js";

export type Severity = "error" | "warning" | "info";
export interface Diagnostic { severity: Severity; code: string; message: string }

function overlaps(a: Rect, b: Rect): boolean {
  return a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
}

function edgeGap(a: Rect, b: Rect): number {
  const dx = Math.max(b[0] - (a[0] + a[2]), a[0] - (b[0] + b[2]), 0);
  const dy = Math.max(b[1] - (a[1] + a[3]), a[1] - (b[1] + b[3]), 0);
  return Math.hypot(dx, dy);
}

function center(rect: Rect): [number, number] {
  return [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2];
}

function isImportant(object: ParsedObject): boolean {
  if (!lintConfig.importantClasses.has(object.maxclass ?? "")) return false;
  return object.maxclass !== "newobj" || (typeof object.text === "string" && !object.text.startsWith("p "));
}

export function lintPatch(patch: ParsedPatch): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  diagnostics.push({ severity: "info", code: "counts", message: `${patch.topLevelObjects.length} top-level objects, ${patch.topLevelConnections.length} patchlines, ${patch.subpatcherCount} inline subpatchers, ${patch.bpatcherCount} bpatchers` });
  const routingCount = patch.objects.filter((object) => {
    const name = object.maxclass === "newobj" ? object.text?.trim().split(/\s+/)[0] : object.maxclass;
    return name === "send" || name === "receive" || name === "s" || name === "r" || name === "send~" || name === "receive~";
  }).length;
  diagnostics.push({ severity: "info", code: "routing-count", message: `${routingCount} send/receive objects` });

  for (const path of new Set(patch.objects.map((object) => object.path))) {
    const objects = patch.objects.filter((object) => object.path === path);
    const ids = new Set(objects.map((object) => object.id));
    const varnames = new Map<string, string>();
    for (const object of objects) {
      if (object.varname) {
        const previous = varnames.get(object.varname);
        if (previous) diagnostics.push({ severity: "error", code: "duplicate-varname", message: `${path}: varname \"${object.varname}\" is used by ${previous} and ${object.id}` });
        else varnames.set(object.varname, object.id);
      }
      const rect = asRect(object.patching_rect);
      if (!rect || rect[2] <= 0 || rect[3] <= 0 || rect[2] > lintConfig.maximumDimension || rect[3] > lintConfig.maximumDimension) {
        diagnostics.push({ severity: "warning", code: "invalid-rect", message: `${path}/${object.id} has an abnormal patching_rect` });
      } else if (Math.abs(rect[0]) > lintConfig.extremeCoordinate || Math.abs(rect[1]) > lintConfig.extremeCoordinate) {
        diagnostics.push({ severity: "warning", code: "extreme-position", message: `${path}/${object.id} is extremely far from the patch origin` });
      }
      if (isImportant(object) && !object.varname) diagnostics.push({ severity: "warning", code: "missing-varname", message: `${path}/${object.id} [${objectLabel(object)}] has no semantic varname` });
    }
    for (let i = 0; i < objects.length; i += 1) {
      const a = objects[i];
      if (!a) continue;
      const aRect = asRect(a.patching_rect);
      if (!aRect) continue;
      for (let j = i + 1; j < objects.length; j += 1) {
        const b = objects[j];
        if (!b) continue;
        const bRect = asRect(b.patching_rect);
        if (!bRect) continue;
        if (overlaps(aRect, bRect)) diagnostics.push({ severity: "warning", code: "overlap", message: `${path}: ${a.id} overlaps ${b.id}` });
        else if (edgeGap(aRect, bRect) < lintConfig.minimumObjectGap) diagnostics.push({ severity: "warning", code: "too-close", message: `${path}: ${a.id} is very close to ${b.id}` });
      }
    }
    for (const connection of patch.connections.filter((item) => item.path === path)) {
      if (!connection.source || !connection.destination) {
        diagnostics.push({ severity: "error", code: "invalid-patchline", message: `${path}: patchline has a malformed endpoint` });
        continue;
      }
      if (!ids.has(connection.source[0])) diagnostics.push({ severity: "error", code: "missing-source", message: `${path}: patchline source ${connection.source[0]} does not exist` });
      if (!ids.has(connection.destination[0])) diagnostics.push({ severity: "error", code: "missing-destination", message: `${path}: patchline destination ${connection.destination[0]} does not exist` });
      if (connection.hidden) diagnostics.push({ severity: "warning", code: "hidden-cord", message: `${path}: hidden patch cord from ${connection.source[0]} to ${connection.destination[0]}` });
      const source = objects.find((object) => object.id === connection.source?.[0]);
      const destination = objects.find((object) => object.id === connection.destination?.[0]);
      const sourceRect = source && asRect(source.patching_rect);
      const destinationRect = destination && asRect(destination.patching_rect);
      if (sourceRect && destinationRect) {
        const [sx, sy] = center(sourceRect); const [dx, dy] = center(destinationRect);
        if (Math.hypot(dx - sx, dy - sy) > lintConfig.longPatchCord) diagnostics.push({ severity: "warning", code: "long-cord", message: `${path}: patch cord from ${source?.id} to ${destination?.id} is unusually long` });
      }
    }
  }

  if (patch.topLevelObjects.length > lintConfig.largeTopLevelObjectCount) diagnostics.push({ severity: "warning", code: "large-top-level", message: `Top level has ${patch.topLevelObjects.length} objects; consider extracting modules` });
  const connected = new Set(patch.connections.flatMap((line) => [line.source?.[0], line.destination?.[0]]).filter((id): id is string => Boolean(id)));
  for (const object of patch.objects) {
    if (!connected.has(object.id) && !lintConfig.danglingExemptClasses.has(object.maxclass ?? "")) diagnostics.push({ severity: "warning", code: "dangling", message: `${object.path}/${object.id} [${objectLabel(object)}] appears dangling` });
  }
  return diagnostics;
}
