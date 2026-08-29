#!/usr/bin/env node
import { resolve } from "node:path";
import { asRect, objectLabel, readMaxpat } from "../shared/maxpat.js";

const args = process.argv.slice(2);
const recursive = args.includes("--recursive");
const file = args.find((arg) => !arg.startsWith("-"));

if (!file) {
  console.error("Usage: npm run max:inspect -- PATCH_FILE [--recursive]");
  process.exitCode = 2;
} else {
  try {
    const patch = await readMaxpat(resolve(file));
    const objects = recursive ? patch.objects : patch.topLevelObjects;
    const connections = recursive ? patch.connections : patch.topLevelConnections;
    console.log(`Objects: ${objects.length}`);
    console.log(`Patchlines: ${connections.length}`);
    console.log(`Inline subpatchers: ${patch.subpatcherCount}`);
    console.log(`Bpatchers: ${patch.bpatcherCount}\n`);
    console.log("Objects:");
    for (const object of objects) {
      const rect = asRect(object.patching_rect);
      const presentation = asRect(object.presentation_rect);
      const varname = object.varname ? ` varname=${object.varname}` : "";
      const location = rect ? `@ (${rect[0]}, ${rect[1]}, ${rect[2]}, ${rect[3]})` : "@ (invalid/missing rect)";
      const presentationText = presentation ? ` presentation=(${presentation.join(", ")})` : "";
      const path = recursive && object.depth > 0 ? ` path=${object.path}` : "";
      console.log(`- ${object.id} [${objectLabel(object)}] ${location}${varname}${presentationText}${path}`);
    }
    console.log("\nConnections:");
    for (const connection of connections) {
      const source = connection.source ? `${connection.source[0]}:${connection.source[1]}` : "<invalid>";
      const destination = connection.destination ? `${connection.destination[0]}:${connection.destination[1]}` : "<invalid>";
      console.log(`- ${source} -> ${destination}${connection.hidden ? " [hidden]" : ""}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
