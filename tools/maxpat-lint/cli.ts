#!/usr/bin/env node
import { resolve } from "node:path";
import { readMaxpat } from "../shared/maxpat.js";
import { lintPatch, type Severity } from "./lint.js";

const file = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
if (!file) {
  console.error("Usage: npm run max:lint -- PATCH_FILE");
  process.exitCode = 2;
} else {
  try {
    const diagnostics = lintPatch(await readMaxpat(resolve(file)));
    const order: Severity[] = ["error", "warning", "info"];
    for (const severity of order) {
      for (const item of diagnostics.filter((diagnostic) => diagnostic.severity === severity)) console.log(`${severity.toUpperCase()} [${item.code}] ${item.message}`);
    }
    const errors = diagnostics.filter((item) => item.severity === "error").length;
    const warnings = diagnostics.filter((item) => item.severity === "warning").length;
    console.log(`\n${errors} error(s), ${warnings} warning(s)`);
    if (errors > 0) process.exitCode = 1;
  } catch (error) {
    console.error(`ERROR [parse] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
