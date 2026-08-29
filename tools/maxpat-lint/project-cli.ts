#!/usr/bin/env node
import { configArgument, readProjectConfig } from "../shared/project-config.js";
import { readMaxpat } from "../shared/maxpat.js";
import { lintPatch, type Severity } from "./lint.js";

const order: Severity[] = ["error", "warning", "info"];

try {
  const project = await readProjectConfig(configArgument(process.argv.slice(2)));
  let errorCount = 0;
  let warningCount = 0;
  for (const patchFile of project.patches) {
    console.log(`=== ${patchFile.relativePath} ===`);
    const diagnostics = lintPatch(await readMaxpat(patchFile.absolutePath));
    for (const severity of order) {
      for (const item of diagnostics.filter((diagnostic) => diagnostic.severity === severity)) {
        console.log(`${severity.toUpperCase()} [${item.code}] ${item.message}`);
      }
    }
    const errors = diagnostics.filter((item) => item.severity === "error").length;
    const warnings = diagnostics.filter((item) => item.severity === "warning").length;
    errorCount += errors;
    warningCount += warnings;
    console.log(`${errors} error(s), ${warnings} warning(s)\n`);
  }
  console.log(`TOTAL ${errorCount} error(s), ${warningCount} warning(s) across ${project.patches.length} patch(es)`);
  if (errorCount > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
