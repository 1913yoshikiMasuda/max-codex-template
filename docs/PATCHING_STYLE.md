# Patching style

This guide makes a patch legible both as a two-dimensional Max program and as structured data reviewed by tools.

## Flow and sections

Within a DSP lane, place sources above processors and sinks below them. Across larger stages—input, analysis, transformation, output—prefer left-to-right progression. A section should not reverse its dominant direction merely to save space.

Separate DSP and control regions spatially. Place control sources beside the objects they govern, while keeping signal trunks visually continuous. Use comments as section headings above a block, aligned to the same 20 px grid. Comments should describe intent, constraints, or rationale rather than restating box text.

Use at least 40 px vertical clearance between processing steps and 80 px between major lanes. Leave additional room for multi-inlet fan-in. Align repeated structures and keep object boxes from overlapping.

## Cords and routing

Prefer short, direct patch cords and stable outlet-to-inlet ordering. Crossings are sometimes unavoidable, but repeated crossings indicate that lanes, object order, or module boundaries should change. Do not hide a cord to make an unclear layout appear clean.

Use `send`/`receive` when a visible long-distance cord would obscure the architecture, or when named module-level routing is genuinely clearer. Names must express domain meaning and should be scoped where collisions are possible. Do not replace a locally readable connection with anonymous wireless routing.

## Module choice

- Use a **subpatcher** to fold implementation detail that belongs only to its parent patch and benefits from being stored inline.
- Use an **abstraction** for a reusable or independently testable unit with a deliberate inlet/outlet contract.
- Use a **bpatcher** when a reusable patch also owns a visible embedded UI surface.

Consider extraction when a coherent block exceeds roughly 12–15 objects, has several crossings, or can be named more clearly than it can be laid out.

## UI and Presentation Mode

Patching Mode is the engineering diagram. Presentation Mode is the operator interface. Build a stable signal/control architecture first, then expose only necessary controls and feedback in Presentation Mode. Keep purely decorative UI out of the patching flow and do not depend on presentation coordinates to explain execution.

Color may reinforce grouping or state, but labels, alignment, whitespace, and topology must remain sufficient without it. Use standard UI components where possible; give controls semantic `varname` values when automation or scripting refers to them.

## Debugging

Place temporary `print`, meters, probes, and test-message objects near the boundary being investigated, and label non-obvious probes. Remove them before delivery. If diagnostics are an intentional feature, isolate them in a named section or module and ensure they do not alter normal timing or signal flow.
