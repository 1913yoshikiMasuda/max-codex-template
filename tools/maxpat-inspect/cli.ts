#!/usr/bin/env node
import { resolve } from "node:path";
import { readMaxpat } from "../shared/maxpat.js";
import { inspectionReport } from "./report.js";

const args = process.argv.slice(2);
const recursive = args.includes("--recursive");
const file = args.find((arg) => !arg.startsWith("-"));

if (!file) {
  console.error("Usage: npm run max:inspect -- PATCH_FILE [--recursive]");
  process.exitCode = 2;
} else {
  try {
    const patch = await readMaxpat(resolve(file));
    console.log(inspectionReport(patch, recursive));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
