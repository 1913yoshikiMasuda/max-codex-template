import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { applyBootstrapPlan, createBootstrapPlan, type ProjectAnswers } from "../tools/project-bootstrap/core.js";

const answers: ProjectAnswers = {
  name: "Spectral Garden Synth",
  slug: "spectral-garden-synth",
  description: "演奏で音響構造が育つシンセサイザー",
  type: "max-audio",
  inputs: ["MIDI", "microphone", "MIDI"],
  outputs: ["stereo audio"],
  runtimes: ["Max 9"],
  externals: [],
  safety: ["起動時は無音"],
  firstFeature: "安全な単音voice"
};

async function createTemplateFixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "max-project-bootstrap-"));
  await mkdir(join(root, ".codex"), { recursive: true });
  await mkdir(join(root, "docs"), { recursive: true });
  await writeFile(join(root, ".codex", "project-bootstrap.json"), JSON.stringify({
    schemaVersion: 1,
    status: "uninitialized",
    template: "max-codex-template",
    templatePackageName: "max-codex-template",
    templateMaxProject: "max-codex-template.maxproj",
    project: null
  }), "utf8");
  await writeFile(join(root, "package.json"), JSON.stringify({
    name: "max-codex-template",
    version: "0.1.0",
    description: "template"
  }), "utf8");
  await writeFile(join(root, "package-lock.json"), JSON.stringify({
    name: "max-codex-template",
    lockfileVersion: 3,
    packages: { "": { name: "max-codex-template", version: "0.1.0" } }
  }), "utf8");
  await writeFile(join(root, "max-tooling.config.json"), JSON.stringify({
    maxProjects: ["max-codex-template.maxproj"],
    patches: ["patchers/**/*.maxpat"]
  }), "utf8");
  await writeFile(join(root, "max-codex-template.maxproj"), JSON.stringify({
    name: "max-codex-template",
    version: 1,
    unknownFutureField: { retained: true }
  }), "utf8");
  const marked = "before\n<!-- project-bootstrap:start -->\ntemplate\n<!-- project-bootstrap:end -->\nafter\n";
  await writeFile(join(root, "README.md"), `# max-codex-template\n${marked}`, "utf8");
  await writeFile(join(root, "AGENTS.md"), marked, "utf8");
  await writeFile(join(root, "docs", "PROJECT_BRIEF.md"), "template", "utf8");
  return root;
}

test("bootstrap preview validates and plans changes without writing", async () => {
  const root = await createTemplateFixture();
  try {
    const before = await readFile(join(root, "package.json"), "utf8");
    const plan = await createBootstrapPlan(root, answers);
    assert.equal(plan.answers.inputs.length, 2);
    assert.equal(plan.writes.length, 8);
    assert.equal(await readFile(join(root, "package.json"), "utf8"), before);
    await assert.rejects(readFile(join(root, "spectral-garden-synth.maxproj"), "utf8"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bootstrap write updates project identity, preserves maxproj fields, and rejects reruns", async () => {
  const root = await createTemplateFixture();
  try {
    const plan = await createBootstrapPlan(root, answers);
    await applyBootstrapPlan(plan);

    const packageDocument = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { name: string; description: string };
    const packageLock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8")) as { name: string; packages: { "": { name: string } } };
    const maxProject = JSON.parse(await readFile(join(root, "spectral-garden-synth.maxproj"), "utf8")) as { name: string; unknownFutureField: { retained: boolean } };
    const state = JSON.parse(await readFile(join(root, ".codex", "project-bootstrap.json"), "utf8")) as { status: string; project: { maxProject: string } };
    assert.equal(packageDocument.name, answers.slug);
    assert.equal(packageDocument.description, answers.description);
    assert.equal(packageLock.name, answers.slug);
    assert.equal(packageLock.packages[""].name, answers.slug);
    assert.equal(maxProject.name, answers.slug);
    assert.equal(maxProject.unknownFutureField.retained, true);
    assert.equal(state.status, "initialized");
    assert.equal(state.project.maxProject, "spectral-garden-synth.maxproj");
    assert.match(await readFile(join(root, "README.md"), "utf8"), /^# Spectral Garden Synth/);
    assert.match(await readFile(join(root, "AGENTS.md"), "utf8"), /起動時は無音/);
    assert.match(await readFile(join(root, "docs", "PROJECT_BRIEF.md"), "utf8"), /安全な単音voice/);
    await assert.rejects(createBootstrapPlan(root, answers), /already initialized/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bootstrap rejects an unsafe slug before reading or writing repository files", async () => {
  await assert.rejects(createBootstrapPlan(".", { ...answers, slug: "Unsafe Name" }), /slug must use lowercase ASCII/);
});
