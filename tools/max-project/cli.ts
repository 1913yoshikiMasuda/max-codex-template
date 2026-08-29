#!/usr/bin/env node
import { relative } from "node:path";
import { configArgument, readProjectConfig } from "../shared/project-config.js";
import { readMaxProject } from "../shared/maxproj.js";
import { checkMaxProjects, type ProjectDiagnosticSeverity } from "./check.js";

const order: ProjectDiagnosticSeverity[] = ["error", "warning", "info"];

try {
  const project = await readProjectConfig(configArgument(process.argv.slice(2)));
  const maxProjects = await Promise.all(project.maxProjects.map((item) => readMaxProject(item.absolutePath)));

  for (const maxProject of maxProjects) {
    console.log(`=== ${relative(project.root, maxProject.projectPath)} ===`);
    console.log(`Name: ${maxProject.document.name ?? "(unnamed)"}`);
    console.log(`Auto-organize: ${maxProject.document.autoorganize ?? "(unspecified)"}`);
    console.log(`Show dependencies: ${maxProject.document.showdependencies ?? "(unspecified)"}`);
    console.log("Contents:");
    for (const entry of maxProject.entries) {
      const location = entry.resolvedPath ?? (entry.candidates.length > 0 ? entry.candidates.join(", ") : "(not local)");
      console.log(`- [${entry.category}] ${entry.name} kind=${entry.metadata.kind ?? "unknown"} local=${entry.metadata.local ?? "unknown"} toplevel=${entry.metadata.toplevel ?? 0} status=${entry.status} path=${location}`);
    }
    console.log("Search paths:");
    if (maxProject.searchPaths.length === 0) console.log("- (none recorded)");
    for (const searchPath of maxProject.searchPaths) console.log(`- ${searchPath.name}: ${JSON.stringify(searchPath.value)}`);
    console.log("");
  }

  const diagnostics = checkMaxProjects(project, maxProjects);
  for (const severity of order) {
    for (const diagnostic of diagnostics.filter((item) => item.severity === severity)) {
      console.log(`${severity.toUpperCase()} [${diagnostic.code}] ${diagnostic.message}`);
    }
  }
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.filter((item) => item.severity === "warning").length;
  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
  if (errors > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
