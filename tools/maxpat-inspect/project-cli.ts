#!/usr/bin/env node
import { configArgument, readProjectConfig } from "../shared/project-config.js";
import { readMaxpat } from "../shared/maxpat.js";
import { inspectionReport } from "./report.js";

const args = process.argv.slice(2);
const recursive = args.includes("--recursive");

try {
  const project = await readProjectConfig(configArgument(args));
  for (const [index, patchFile] of project.patches.entries()) {
    if (index > 0) console.log("");
    console.log(`=== ${patchFile.relativePath} ===`);
    console.log(inspectionReport(await readMaxpat(patchFile.absolutePath), recursive));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
