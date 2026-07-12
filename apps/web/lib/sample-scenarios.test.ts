import { describe, expect, it } from "vitest";
import { sampleScenarios } from "./sample-scenarios";

describe("sample scenarios", () => {
  it("covers strong, moderate, funding-only, irrelevant, and multi-signal QA cases", () => {
    expect(sampleScenarios.map((sample) => sample.id)).toEqual([
      "strong",
      "moderate",
      "funding-only",
      "irrelevant",
      "multi-signal",
    ]);
    expect(sampleScenarios.every((sample) => sample.expectedBandForQaOnly)).toBe(true);
  });
});
