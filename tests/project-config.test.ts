import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { globToRegExp, readProjectConfig } from "../tools/shared/project-config.js";
import { readMaxProject } from "../tools/shared/maxproj.js";
import { checkMaxProjects } from "../tools/max-project/check.js";

test("project patch globs match top-level and nested maxpat files", () => {
  const pattern = globToRegExp("patchers/**/*.maxpat");
  assert.equal(pattern.test("patchers/main.maxpat"), true);
  assert.equal(pattern.test("patchers/modules/input.maxpat"), true);
  assert.equal(pattern.test("elsewhere/main.maxpat"), false);
});

test("project config discovers multiple patches and applies exclusions", async () => {
  const root = await mkdtemp(join(tmpdir(), "max-tooling-config-"));
  try {
    await mkdir(join(root, "patchers", "modules"), { recursive: true });
    await writeFile(join(root, "patchers", "main.maxpat"), "{}", "utf8");
    await writeFile(join(root, "patchers", "modules", "voice.maxpat"), "{}", "utf8");
    await writeFile(join(root, "patchers", "modules", "ignore.maxpat"), "{}", "utf8");
    await writeFile(join(root, "work.maxproj"), JSON.stringify({
      name: "work",
      contents: { patchers: { "main.maxpat": { kind: "patcher", local: 1, toplevel: 1 } } },
      searchpath: {}
    }), "utf8");
    const configPath = join(root, "max-tooling.config.json");
    await writeFile(configPath, JSON.stringify({
      patches: ["patchers/**/*.maxpat"],
      maxProjects: ["*.maxproj"],
      exclude: ["**/ignore.maxpat"],
      lintBaseline: "quality/maxpat-baseline.json"
    }), "utf8");

    const project = await readProjectConfig(configPath);
    assert.deepEqual(project.patches.map((patch) => patch.relativePath), [
      "patchers/main.maxpat",
      "patchers/modules/voice.maxpat"
    ]);
    assert.deepEqual(project.maxProjects.map((item) => item.relativePath), ["work.maxproj"]);
    assert.equal(project.lintBaselinePath, join(root, "quality", "maxpat-baseline.json"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("maxproj resolution reports local, global, missing, and tooling coverage", async () => {
  const root = await mkdtemp(join(tmpdir(), "max-project-check-"));
  try {
    await mkdir(join(root, "patchers"), { recursive: true });
    await writeFile(join(root, "patchers", "main.maxpat"), "{}", "utf8");
    const projectPath = join(root, "work.maxproj");
    await writeFile(projectPath, JSON.stringify({
      name: "work",
      autoorganize: 1,
      contents: {
        patchers: {
          "main.maxpat": { kind: "patcher", local: 1, toplevel: 1 },
          "missing.maxpat": { kind: "patcher", local: 1 }
        },
        code: {
          "global.js": { kind: "javascript", local: 0 }
        }
      },
      searchpath: { external: { path: "../shared" } }
    }), "utf8");
    const configPath = join(root, "max-tooling.config.json");
    await writeFile(configPath, JSON.stringify({
      maxProjects: ["work.maxproj"],
      patches: ["patchers/**/*.maxpat"]
    }), "utf8");

    const project = await readProjectConfig(configPath);
    const maxProject = await readMaxProject(projectPath);
    assert.equal(maxProject.entries.find((entry) => entry.name === "main.maxpat")?.status, "resolved");
    assert.equal(maxProject.entries.find((entry) => entry.name === "missing.maxpat")?.status, "missing");
    assert.equal(maxProject.entries.find((entry) => entry.name === "global.js")?.status, "global");
    assert.deepEqual(maxProject.searchPaths, [{ name: "external", value: { path: "../shared" } }]);

    const diagnostics = checkMaxProjects(project, [maxProject]);
    assert.ok(diagnostics.some((item) => item.severity === "warning" && item.code === "unresolved-local-project-file"));
    assert.ok(!diagnostics.some((item) => item.code === "uninspected-project-patch" && item.message.includes("main.maxpat")));

    const withoutSearchPaths = checkMaxProjects(project, [{ ...maxProject, searchPaths: [] }]);
    assert.ok(withoutSearchPaths.some((item) => item.severity === "error" && item.code === "missing-local-project-file"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
