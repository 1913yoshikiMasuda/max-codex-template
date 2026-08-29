export const lintConfig = {
  minimumObjectGap: 8,
  longPatchCord: 600,
  largeTopLevelObjectCount: 100,
  extremeCoordinate: 10_000,
  maximumDimension: 4_000,
  importantClasses: new Set(["newobj", "gain~", "ezdac~", "dac~", "adc~", "inlet", "outlet"]),
  danglingExemptClasses: new Set(["comment", "panel", "led", "meter~", "ezdac~", "dac~", "loadbang", "inlet", "outlet"]),
} as const;
