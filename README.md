# max-codex-template

A small, practical Max 9 project foundation for work shared by Max developers and Codex. It keeps `.maxpat` files as the deliverable while providing read-only TypeScript tools that make their structure and layout reviewable.

## Quick start

Requires Node.js 20+ and, for help search, a local Max installation.

```bash
npm install
npm run max:lint -- patchers/main.maxpat
npm run max:inspect -- patchers/main.maxpat
npm run max:help -- cycle~
```

Use `--recursive` with `max:inspect` to include nested subpatchers. Override Max discovery when necessary:

```bash
MAX_HOME=/path/to/Max.app npm run max:help -- pfft~
```

Development checks are `npm run typecheck`, `npm run build`, and `npm test`.

## Starting a project from this template

1. Create a new repository from this template (or copy it without its Git history).
2. Rename the repository for the work or system.
3. Create a `.maxproj`, or place an existing Max Project in the repository.
4. Add project-specific constraints and dependencies to `AGENTS.md`.
5. Open the repository root in VS Code.
6. Ask Codex to implement a feature, requiring local Max references when object behavior is uncertain.

The repository unit is one work, system, or client project—not one patch. Each copied project is an independent Git repository; this template is not intended to be a submodule. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tools

- `max:inspect` reports objects, semantic names, rectangles, connections, inline subpatchers, and referenced bpatchers.
- `max:lint` detects broken connections and duplicate semantic names, plus conservative layout and maintainability warnings. Thresholds live in one config module.
- `max:help` searches Max's local help, reference, tutorial, and example filenames. It checks `MAX_HOME`, common macOS installations, and `~/Documents/Max 9/Packages`, labeling C74 and user-package results separately.

All three tools are read-only. The shared parser intentionally models only the fields needed here and retains the original document in memory, leaving room for a future declarative generator without introducing a DSL now.

## Repository layout

The requested structure is retained, with two small additions: `tools/shared` avoids duplicated parsing logic, and `tests/fixtures` holds minimal Max-independent fixtures. `tsconfig.json` supports the TypeScript toolchain.

```text
docs/                 workflow and patching guidance
patchers/main.maxpat  verified standard-object sample
tools/shared/         narrow, reusable maxpat parser
tools/maxpat-inspect/ structural inspection CLI
tools/maxpat-lint/    diagnostics CLI and centralized thresholds
tools/max-help-search/local Max resource search
tests/fixtures/       deterministic parser/linter inputs
```
