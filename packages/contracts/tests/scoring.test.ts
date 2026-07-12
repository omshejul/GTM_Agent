import { describe, expect, it } from "vitest";
import { scoreSignals } from "../src";

describe("scoreSignals", () => {
  it("deduplicates signals and caps the score", () => {
    expect(scoreSignals(["new_warehouse", "new_warehouse"]).intentScore).toBe(30);
    expect(scoreSignals(["new_warehouse", "warehouse_lease", "automation_investment", "leadership_hiring", "regional_expansion"]).intentScore).toBe(100);
  });
  it("floors weak evidence at zero", () => expect(scoreSignals(["weak_evidence"]).intentScore).toBe(0));
});
