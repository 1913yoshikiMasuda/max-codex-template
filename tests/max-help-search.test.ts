import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { candidateSources, searchSources } from "../tools/max-help-search/search.js";

test("includes the standard Max 9 user package directory without hard-coding a home", () => {
  const sources = candidateSources({ userHome: "/example/user" });
  assert.ok(sources.some((source) => source.label === "USER PACKAGE" && source.root === "/example/user/Documents/Max 9/Packages"));
});

test("finds help files in a user package source and labels their origin", async () => {
  const root = await mkdtemp(join(tmpdir(), "max-help-search-"));
  try {
    const helpDirectory = join(root, "FluidCorpusManipulation", "help");
    await mkdir(helpDirectory, { recursive: true });
    const helpPath = join(helpDirectory, "fluid.pitch~.maxhelp");
    await writeFile(helpPath, "{}", "utf8");
    const matches = await searchSources("fluid.pitch~", [{ label: "USER PACKAGE", root }]);
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.relevance, 100);
    assert.equal(matches[0]?.source, "USER PACKAGE");
    assert.equal(matches[0]?.path, helpPath);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
