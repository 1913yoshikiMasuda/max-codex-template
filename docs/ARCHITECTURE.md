# Template architecture

The intended lifecycle is:

```text
max-codex-template
        ↓ copy or repository template
individual-max-project (independent Git repository)
```

One repository represents one work, system, or engagement. It may contain several top-level patches, abstractions, media assets, JavaScript, externals, and project documentation. “One patch = one repository” is not the rule.

The tools share only a narrow parser. Inspection and linting consume the same in-memory representation and never rewrite source files. The help searcher is independent because it searches an installed Max tree rather than parsing a project patch. This separation keeps the template small while allowing a future generator to use the parser types without coupling generation to lint output.

Projects copied from the template do not reference this repository as a submodule. This prevents tooling version changes from silently affecting active works and lets project-specific conventions evolve. If the parser, linter, and search tool mature across several projects, they may later move into a separately versioned `max-codex-tools` package/repository.

Likely future extension points are configuration-file loading around the centralized lint defaults, a declarative patch-spec writer that preserves unknown fields, and Max-aware integration tests. None is required by the current template.
