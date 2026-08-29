#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { configArgument, readProjectConfig } from "../shared/project-config.js";
import { readMaxpat } from "../shared/maxpat.js";
import { compareBaseline, summarizeDiagnostics, type PatchBaseline } from "./baseline-core.js";
import { lintPatch } from "./lint.js";

interface BaselineFile {
  version: 1;
  patches: Record<string, PatchBaseline>;
}

const summarize = async (absolutePath: string): Promise<PatchBaseline> =>
  summarizeDiagnostics(lintPatch(await readMaxpat(absolutePath)));

const args = process.argv.slice(2);
const write = args.includes("--write");

try {
  const project = await readProjectConfig(configArgument(args));
  const current: BaselineFile = { version: 1, patches: {} };
  for (const patch of project.patches) current.patches[patch.relativePath] = await summarize(patch.absolutePath);

  if (write) {
    await writeFile(project.lintBaselinePath, `${JSON.stringify(current, null, 2)}\n`, "utf8");
    console.log(`Updated lint baseline: ${relative(project.root, project.lintBaselinePath)}`);
    console.log(`Recorded ${project.patches.length} patch(es). Review and commit this file intentionally.`);
  } else {
    const baseline = JSON.parse(await readFile(project.lintBaselinePath, "utf8")) as BaselineFile;
    let failed = false;
    for (const patch of project.patches) {
      const actual = current.patches[patch.relativePath];
      if (!actual) continue;
      const expected = baseline.patches?.[patch.relativePath] ?? { errors: 0, warnings: 0, warningCodes: {} };
      const comparison = compareBaseline(actual, expected);
      console.log(`Lint baseline: ${patch.relativePath}`);
      console.log(`Errors: ${actual.errors} (baseline ${expected.errors})`);
      console.log(`Warnings: ${actual.warnings} (baseline ${expected.warnings}, informational)`);
      for (const code of Object.keys(comparison.warningCodeDeltas).sort()) {
        const before = expected.warningCodes?.[code] ?? 0;
        const after = actual.warningCodes[code] ?? 0;
        if (before !== after) console.log(`INFO warning ${code}: ${after} (baseline ${before}, delta ${after - before})`);
      }
      if (comparison.errorIncrease > 0) {
        failed = true;
        console.error(`FAIL error count increased by ${comparison.errorIncrease}`);
      } else {
        console.log("PASS no lint error increase");
      }
      console.log("");
    }
    for (const baselinePath of Object.keys(baseline.patches ?? {})) {
      if (!current.patches[baselinePath]) console.log(`INFO baseline patch is no longer configured: ${baselinePath}`);
    }
    if (failed) process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
