#!/usr/bin/env node
import { relative } from "node:path";
import { applyBootstrapPlan, createBootstrapPlan, type ProjectAnswers } from "./core.js";

interface ParsedArguments extends ProjectAnswers {
  root: string;
  write: boolean;
}

const usage = `Usage:
  npm run project:init -- --name NAME --slug SLUG --description TEXT \\
    --input VALUE --output VALUE --runtime VALUE --safety VALUE \\
    --type VALUE --first-feature TEXT [--external VALUE] [--write]

Repeat --input, --output, --runtime, --external, and --safety when needed.
Without --write, the command validates the answers and prints a preview only.`;

function parseArguments(args: string[]): ParsedArguments {
  const values: Record<string, string[]> = {};
  let write = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--write") {
      write = true;
      continue;
    }
    if (!argument?.startsWith("--")) throw new Error(`Unexpected argument: ${argument ?? ""}`);
    const key = argument.slice(2);
    const allowed = new Set(["name", "slug", "description", "type", "input", "output", "runtime", "external", "safety", "first-feature", "root"]);
    if (!allowed.has(key)) throw new Error(`Unknown option: ${argument}`);
    const value = args[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
    (values[key] ??= []).push(value);
    index += 1;
  }
  const one = (key: string, fallback = ""): string => {
    const candidates = values[key] ?? [];
    if (candidates.length > 1) throw new Error(`--${key} may only be specified once.`);
    return candidates[0] ?? fallback;
  };
  return {
    root: one("root", process.cwd()),
    write,
    name: one("name"),
    slug: one("slug"),
    description: one("description"),
    type: one("type"),
    inputs: values.input ?? [],
    outputs: values.output ?? [],
    runtimes: values.runtime ?? [],
    externals: values.external ?? [],
    safety: values.safety ?? [],
    firstFeature: one("first-feature")
  };
}

async function main(): Promise<void> {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log(usage);
    return;
  }
  const parsed = parseArguments(process.argv.slice(2));
  const plan = await createBootstrapPlan(parsed.root, parsed);
  console.log(`Project: ${plan.answers.name} (${plan.answers.slug})`);
  console.log(`Mode: ${parsed.write ? "WRITE" : "PREVIEW"}`);
  console.log("Changes:");
  for (const item of plan.writes) console.log(`- update ${relative(plan.root, item.path)}`);
  if (plan.oldMaxProjectPath !== plan.newMaxProjectPath) {
    console.log(`- rename ${relative(plan.root, plan.oldMaxProjectPath)} -> ${relative(plan.root, plan.newMaxProjectPath)}`);
  }
  if (!parsed.write) {
    console.log("No files changed. Review this preview, then repeat with --write.");
    return;
  }
  await applyBootstrapPlan(plan);
  console.log("Project bootstrap complete.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage);
  process.exitCode = 1;
});
