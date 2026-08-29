import { asRect, objectLabel, type ParsedPatch } from "../shared/maxpat.js";

export function inspectionReport(patch: ParsedPatch, recursive = false): string {
  const objects = recursive ? patch.objects : patch.topLevelObjects;
  const connections = recursive ? patch.connections : patch.topLevelConnections;
  const lines = [
    `Objects: ${objects.length}`,
    `Patchlines: ${connections.length}`,
    `Inline subpatchers: ${patch.subpatcherCount}`,
    `Bpatchers: ${patch.bpatcherCount}`,
    "",
    "Objects:"
  ];
  for (const object of objects) {
    const rect = asRect(object.patching_rect);
    const presentation = asRect(object.presentation_rect);
    const varname = object.varname ? ` varname=${object.varname}` : "";
    const location = rect ? `@ (${rect[0]}, ${rect[1]}, ${rect[2]}, ${rect[3]})` : "@ (invalid/missing rect)";
    const presentationText = presentation ? ` presentation=(${presentation.join(", ")})` : "";
    const path = recursive && object.depth > 0 ? ` path=${object.path}` : "";
    lines.push(`- ${object.id} [${objectLabel(object)}] ${location}${varname}${presentationText}${path}`);
  }
  lines.push("", "Connections:");
  for (const connection of connections) {
    const source = connection.source ? `${connection.source[0]}:${connection.source[1]}` : "<invalid>";
    const destination = connection.destination ? `${connection.destination[0]}:${connection.destination[1]}` : "<invalid>";
    lines.push(`- ${source} -> ${destination}${connection.hidden ? " [hidden]" : ""}`);
  }
  return lines.join("\n");
}
