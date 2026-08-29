# Max project instructions

These rules apply to every change in this repository. Preserve valid but unknown `.maxpat` fields and prefer small, reviewable changes.

## Max reference policy

- When an object, attribute, message, inlet, or outlet is uncertain, search the locally installed Max 9 help, examples, and tutorials before editing. Use `npm run max:help -- OBJECT_NAME` as the first step.
- Do not invent unverified Max objects or attributes. Do not assume behavior copied from an older Max release remains current.
- Prefer Max 9 standard objects. When adding an external, state clearly that it is an external, document its source/version, and minimize the dependency.
- If local evidence is insufficient, consult current official Cycling '74 documentation and record any important compatibility assumption.

## Patching conventions

- Make DSP signal chains flow top to bottom. Make multi-stage or module-to-module flow move left to right. Do not repeatedly reverse direction inside a section.
- Use a 20 px grid. Target at least 40 px of vertical space between successive objects and at least 80 px between major processing lanes. Never overlap boxes.
- Avoid patch-cord crossings. If many cords travel long distances, reconsider the structure.
- Hidden patch cords are prohibited by default. Use `send`/`receive` only for meaningful long-distance or inter-module routing, and give each route a semantic name.
- Keep the top level architectural. When a logical block grows beyond roughly 12–15 objects, consider an abstraction, subpatcher, or `bpatcher`.
- Add a short comment for each major block. Explain purpose or rationale; do not merely repeat an object name.
- Give important objects stable semantic `varname` values such as `input_gain`, `onset_detector`, and `audio_output`. Max-generated IDs may remain opaque, but scripts must not depend on names such as `obj-37`, `thing1`, or `foo`.
- Keep Patching Mode readable as a circuit/architecture view. Put end-user UI composition in Presentation Mode; do not clutter the patching view merely to improve presentation.
- Keep DSP and control-message paths visually distinct. Do not rely on color alone to communicate their meaning.
- Remove temporary debugging objects before delivery, or group and label intentionally retained diagnostics.

## Required checks

Before completing a patch change, run:

```bash
npm run typecheck
npm test
npm run max:inspect -- patchers/main.maxpat
npm run max:lint -- patchers/main.maxpat
```

Treat lint errors as failures. Review warnings in context rather than suppressing them casually.
