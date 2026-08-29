import type { Diagnostic } from "./lint.js";

export interface PatchBaseline {
  errors: number;
  warnings: number;
  warningCodes: Record<string, number>;
}

export interface BaselineComparison {
  errorIncrease: number;
  warningDelta: number;
  warningCodeDeltas: Record<string, number>;
}

export function summarizeDiagnostics(diagnostics: Diagnostic[]): PatchBaseline {
  const warningCodes: Record<string, number> = {};
  for (const diagnostic of diagnostics.filter((item) => item.severity === "warning")) {
    warningCodes[diagnostic.code] = (warningCodes[diagnostic.code] ?? 0) + 1;
  }
  return {
    errors: diagnostics.filter((item) => item.severity === "error").length,
    warnings: diagnostics.filter((item) => item.severity === "warning").length,
    warningCodes
  };
}

export function compareBaseline(actual: PatchBaseline, expected: PatchBaseline): BaselineComparison {
  const warningCodeDeltas: Record<string, number> = {};
  const codes = new Set([...Object.keys(expected.warningCodes), ...Object.keys(actual.warningCodes)]);
  for (const code of codes) {
    const delta = (actual.warningCodes[code] ?? 0) - (expected.warningCodes[code] ?? 0);
    if (delta !== 0) warningCodeDeltas[code] = delta;
  }
  return {
    errorIncrease: Math.max(0, actual.errors - expected.errors),
    warningDelta: actual.warnings - expected.warnings,
    warningCodeDeltas
  };
}
