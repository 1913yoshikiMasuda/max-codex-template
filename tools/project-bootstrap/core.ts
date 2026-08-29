import { access, readFile, rename, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

export interface ProjectAnswers {
  name: string;
  slug: string;
  description: string;
  type: string;
  inputs: string[];
  outputs: string[];
  runtimes: string[];
  externals: string[];
  safety: string[];
  firstFeature: string;
}

interface UninitializedState {
  schemaVersion: 1;
  status: "uninitialized";
  template: string;
  templatePackageName: string;
  templateMaxProject: string;
  project: null;
}

interface InitializedState {
  schemaVersion: 1;
  status: "initialized";
  template: string;
  project: ProjectAnswers & { maxProject: string };
}

type BootstrapState = UninitializedState | InitializedState;

interface JsonObject {
  [key: string]: unknown;
}

export interface BootstrapPlan {
  root: string;
  oldMaxProjectPath: string;
  newMaxProjectPath: string;
  writes: Array<{ path: string; content: string }>;
  answers: ProjectAnswers;
}

const bootstrapStart = "<!-- project-bootstrap:start -->";
const bootstrapEnd = "<!-- project-bootstrap:end -->";
const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;

function requireObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be a JSON object.`);
  }
  return value as JsonObject;
}

function requireNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required.`);
  return normalized;
}

function normalizeList(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function validateAnswers(input: ProjectAnswers): ProjectAnswers {
  const answers = {
    ...input,
    name: requireNonEmpty(input.name, "name"),
    slug: requireNonEmpty(input.slug, "slug"),
    description: requireNonEmpty(input.description, "description"),
    type: requireNonEmpty(input.type, "type"),
    inputs: normalizeList(input.inputs),
    outputs: normalizeList(input.outputs),
    runtimes: normalizeList(input.runtimes),
    externals: normalizeList(input.externals),
    safety: normalizeList(input.safety),
    firstFeature: requireNonEmpty(input.firstFeature, "first-feature")
  };
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(answers.slug)) {
    throw new Error("slug must use lowercase ASCII letters, numbers, dots, underscores, or hyphens.");
  }
  for (const [label, values] of [["input", answers.inputs], ["output", answers.outputs], ["runtime", answers.runtimes], ["safety", answers.safety]] as const) {
    if (values.length === 0) throw new Error(`At least one ${label} is required.`);
  }
  return answers;
}

function replaceBootstrapBlock(source: string, replacement: string, label: string): string {
  const start = source.indexOf(bootstrapStart);
  const end = source.indexOf(bootstrapEnd);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`${label} is missing the project bootstrap markers.`);
  }
  const after = end + bootstrapEnd.length;
  return `${source.slice(0, start)}${bootstrapStart}\n${replacement.trim()}\n${bootstrapEnd}${source.slice(after)}`;
}

function bullets(values: string[], empty = "なし"): string {
  return values.length > 0 ? values.map((value) => `- ${value}`).join("\n") : `- ${empty}`;
}

function projectBrief(answers: ProjectAnswers, maxProject: string): string {
  return `# ${answers.name}：プロジェクト概要

このfileはtemplate初期化時の回答から生成されます。現在の要件を更新する場合は、実装と矛盾しないように内容をレビューしてください。

## 基本情報

- Package slug: \`${answers.slug}\`
- Project type: ${answers.type}
- Max Project: \`${maxProject}\`
- 概要: ${answers.description}

## Input

${bullets(answers.inputs)}

## Output

${bullets(answers.outputs)}

## Runtime構成

${bullets(answers.runtimes)}

## External / package

${bullets(answers.externals)}

## 安全要件

${bullets(answers.safety)}

## 最初に実装する機能

${answers.firstFeature}
`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path: string, label: string): Promise<JsonObject> {
  try {
    return requireObject(JSON.parse(await readFile(path, "utf8")) as unknown, label);
  } catch (error) {
    throw new Error(`Cannot read ${label} at ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function createBootstrapPlan(rootArgument: string, input: ProjectAnswers): Promise<BootstrapPlan> {
  const root = resolve(rootArgument);
  const answers = validateAnswers(input);
  const rootFolderName = basename(root);
  if (rootFolderName !== answers.slug) {
    throw new Error(
      `Max requires the project folder name to match the .maxproj name. Rename folder "${rootFolderName}" to "${answers.slug}" before bootstrap.`
    );
  }
  const statePath = resolve(root, ".codex/project-bootstrap.json");
  const state = await readJson(statePath, "bootstrap state") as unknown as BootstrapState;
  if (state.schemaVersion !== 1) throw new Error("Unsupported project bootstrap schemaVersion.");
  if (state.status !== "uninitialized") throw new Error("This repository is already initialized.");
  if (state.project !== null || typeof state.templatePackageName !== "string" || typeof state.templateMaxProject !== "string") {
    throw new Error("The uninitialized bootstrap state is invalid.");
  }

  const packagePath = resolve(root, "package.json");
  const packageLockPath = resolve(root, "package-lock.json");
  const toolingPath = resolve(root, "max-tooling.config.json");
  const readmePath = resolve(root, "README.md");
  const agentsPath = resolve(root, "AGENTS.md");
  const briefPath = resolve(root, "docs/PROJECT_BRIEF.md");
  const oldMaxProjectPath = resolve(root, state.templateMaxProject);
  const newMaxProjectName = `${answers.slug}.maxproj`;
  const newMaxProjectPath = resolve(root, newMaxProjectName);

  if (basename(state.templateMaxProject) !== state.templateMaxProject) {
    throw new Error("templateMaxProject must be a repository-root filename.");
  }
  if (!(await fileExists(oldMaxProjectPath))) throw new Error(`Template Max Project is missing: ${state.templateMaxProject}`);
  if (oldMaxProjectPath !== newMaxProjectPath && await fileExists(newMaxProjectPath)) {
    throw new Error(`Target Max Project already exists: ${newMaxProjectName}`);
  }

  const packageDocument = await readJson(packagePath, "package.json");
  if (packageDocument.name !== state.templatePackageName) {
    throw new Error(`package.json name must still be ${state.templatePackageName} before initialization.`);
  }
  const packageLockDocument = await readJson(packageLockPath, "package-lock.json");
  const lockPackages = requireObject(packageLockDocument.packages, "package-lock.json packages");
  const lockRoot = requireObject(lockPackages[""], "package-lock.json root package");
  if (packageLockDocument.name !== state.templatePackageName || lockRoot.name !== state.templatePackageName) {
    throw new Error(`package-lock.json name must still be ${state.templatePackageName} before initialization.`);
  }
  const toolingDocument = await readJson(toolingPath, "max-tooling.config.json");
  const maxProjects = toolingDocument.maxProjects;
  if (!Array.isArray(maxProjects) || !maxProjects.includes(state.templateMaxProject)) {
    throw new Error(`max-tooling.config.json must reference ${state.templateMaxProject} before initialization.`);
  }
  const maxProjectDocument = await readJson(oldMaxProjectPath, state.templateMaxProject);
  if (maxProjectDocument.name !== state.template) {
    throw new Error(`Template Max Project name must still be ${state.template} before initialization.`);
  }

  packageDocument.name = answers.slug;
  packageDocument.description = answers.description;
  packageLockDocument.name = answers.slug;
  lockRoot.name = answers.slug;
  toolingDocument.maxProjects = maxProjects.map((value) => value === state.templateMaxProject ? newMaxProjectName : value);
  maxProjectDocument.name = answers.slug;

  const readme = await readFile(readmePath, "utf8");
  const agents = await readFile(agentsPath, "utf8");
  const templateReadmeTitle = `# ${state.template}`;
  if (!readme.startsWith(`${templateReadmeTitle}\n`)) {
    throw new Error(`README.md must still start with ${templateReadmeTitle} before initialization.`);
  }
  const projectReadme = `# ${answers.name}${readme.slice(templateReadmeTitle.length)}`;
  const readmeProject = `## ${answers.name}\n\n${answers.description}\n\nProject type: ${answers.type}\n\nMax Project: \`${newMaxProjectName}\`\n\n詳細は [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md) を参照してください。`;
  const agentsProject = `## Project固有情報\n\n- 作品名: ${answers.name}\n- 概要: ${answers.description}\n- Project type: ${answers.type}\n- Input: ${answers.inputs.join(" / ")}\n- Output: ${answers.outputs.join(" / ")}\n- Runtime: ${answers.runtimes.join(" / ")}\n- External / package: ${answers.externals.join(" / ") || "なし"}\n- 安全要件: ${answers.safety.join(" / ")}\n- 最初の機能: ${answers.firstFeature}\n- 詳細: \`docs/PROJECT_BRIEF.md\`\n\n実装によりinterface、dependency、起動順序、port、または保護対象fileが確定したら、このsectionまたは関連documentationへ追記してください。`;
  const initializedState: InitializedState = {
    schemaVersion: 1,
    status: "initialized",
    template: state.template,
    project: { ...answers, maxProject: newMaxProjectName }
  };

  return {
    root,
    oldMaxProjectPath,
    newMaxProjectPath,
    answers,
    writes: [
      { path: packagePath, content: json(packageDocument) },
      { path: packageLockPath, content: json(packageLockDocument) },
      { path: toolingPath, content: json(toolingDocument) },
      { path: oldMaxProjectPath, content: json(maxProjectDocument) },
      { path: readmePath, content: replaceBootstrapBlock(projectReadme, readmeProject, "README.md") },
      { path: agentsPath, content: replaceBootstrapBlock(agents, agentsProject, "AGENTS.md") },
      { path: briefPath, content: projectBrief(answers, newMaxProjectName) },
      { path: statePath, content: json(initializedState) }
    ]
  };
}

export async function applyBootstrapPlan(plan: BootstrapPlan): Promise<void> {
  const stateWrite = plan.writes.find((item) => item.path.endsWith(".codex/project-bootstrap.json"));
  const otherWrites = plan.writes.filter((item) => item !== stateWrite);
  for (const item of otherWrites) await writeFile(item.path, item.content, "utf8");
  if (plan.oldMaxProjectPath !== plan.newMaxProjectPath) {
    await rename(plan.oldMaxProjectPath, plan.newMaxProjectPath);
  }
  if (!stateWrite) throw new Error("Bootstrap plan is missing its final state write.");
  await writeFile(stateWrite.path, stateWrite.content, "utf8");
}
