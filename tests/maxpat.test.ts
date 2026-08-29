import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readMaxpat } from "../tools/shared/maxpat.js";
import { compareBaseline, summarizeDiagnostics } from "../tools/maxpat-lint/baseline-core.js";
import { lintPatch } from "../tools/maxpat-lint/lint.js";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");

test("parses a valid maxpat and detects a nested subpatcher", async () => {
  const patch = await readMaxpat(join(fixtures, "valid.maxpat"));
  assert.equal(patch.topLevelObjects.length, 4);
  assert.equal(patch.objects.length, 5);
  assert.equal(patch.topLevelConnections.length, 2);
  assert.equal(patch.subpatcherCount, 1);
  assert.equal(patch.bpatcherCount, 1);
});

test("reports a connection to a missing object", async () => {
  const diagnostics = lintPatch(await readMaxpat(join(fixtures, "invalid-connection.maxpat")));
  assert.ok(diagnostics.some((item) => item.severity === "error" && item.code === "missing-destination"));
});

test("reports overlaps and duplicate semantic varnames", async () => {
  const diagnostics = lintPatch(await readMaxpat(join(fixtures, "layout-errors.maxpat")));
  assert.ok(diagnostics.some((item) => item.code === "overlap"));
  assert.ok(diagnostics.some((item) => item.severity === "error" && item.code === "duplicate-varname"));
});

test("lint baseline fails only on error increases while retaining warning deltas", () => {
  const expected = summarizeDiagnostics([
    { severity: "warning", code: "too-close", message: "existing" }
  ]);
  const warningOnly = summarizeDiagnostics([
    { severity: "warning", code: "too-close", message: "existing" },
    { severity: "warning", code: "missing-varname", message: "new warning" }
  ]);
  const warningComparison = compareBaseline(warningOnly, expected);
  assert.equal(warningComparison.errorIncrease, 0);
  assert.equal(warningComparison.warningDelta, 1);
  assert.equal(warningComparison.warningCodeDeltas["missing-varname"], 1);

  const withError = summarizeDiagnostics([
    { severity: "warning", code: "too-close", message: "existing" },
    { severity: "error", code: "missing-destination", message: "new error" }
  ]);
  assert.equal(compareBaseline(withError, expected).errorIncrease, 1);
});
