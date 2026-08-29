import { relative, resolve, sep } from "node:path";
import type { ResolvedProjectConfig } from "../shared/project-config.js";
import type { ResolvedMaxProject } from "../shared/maxproj.js";

export type ProjectDiagnosticSeverity = "error" | "warning" | "info";

export interface ProjectDiagnostic {
  severity: ProjectDiagnosticSeverity;
  code: string;
  message: string;
}

const isPatcherEntry = (category: string, name: string, kind: unknown): boolean =>
  category.toLowerCase() === "patchers" || kind === "patcher" || name.toLowerCase().endsWith(".maxpat");

const toolingRelativePath = (project: ResolvedProjectConfig, maxProject: ResolvedMaxProject, entryPath: string): string =>
  relative(project.root, resolve(maxProject.root, entryPath)).split(sep).join("/");

export function checkMaxProjects(project: ResolvedProjectConfig, maxProjects: ResolvedMaxProject[]): ProjectDiagnostic[] {
  const diagnostics: ProjectDiagnostic[] = [];
  const configuredPatches = new Set(project.patches.map((patch) => patch.relativePath));
  const projectPatches = new Set<string>();

  if (maxProjects.length === 0) {
    diagnostics.push({
      severity: "info",
      code: "no-max-project",
      message: "No .maxproj is configured; patch inspection remains available through patches globs."
    });
  }

  for (const maxProject of maxProjects) {
    const label = maxProject.document.name || maxProject.projectPath;
    for (const entry of maxProject.entries) {
      const entryLabel = `${label}/${entry.category}/${entry.name}`;
      if (entry.status === "missing") {
        if (maxProject.searchPaths.length > 0) {
          diagnostics.push({ severity: "warning", code: "unresolved-local-project-file", message: `${entryLabel} was not found below the Project root; verify the recorded Project search paths in Max.` });
        } else {
          diagnostics.push({ severity: "error", code: "missing-local-project-file", message: `${entryLabel} is local but no matching file exists.` });
        }
      } else if (entry.status === "ambiguous") {
        diagnostics.push({ severity: "warning", code: "ambiguous-project-file", message: `${entryLabel} matches multiple files: ${entry.candidates.join(", ")}` });
      }
      if (isPatcherEntry(entry.category, entry.name, entry.metadata.kind) && entry.resolvedPath) {
        const patchPath = toolingRelativePath(project, maxProject, entry.resolvedPath);
        projectPatches.add(patchPath);
        if (!configuredPatches.has(patchPath)) {
          diagnostics.push({ severity: "warning", code: "uninspected-project-patch", message: `${patchPath} is registered in ${label} but not selected by max-tooling.config.json.` });
        }
      }
    }
  }

  for (const patch of configuredPatches) {
    if (!projectPatches.has(patch)) {
      diagnostics.push({ severity: "info", code: "tooling-only-patch", message: `${patch} is inspected by tooling but is not a resolved patcher in a configured .maxproj.` });
    }
  }
  return diagnostics;
}
