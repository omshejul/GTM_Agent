import { describe, expect, it } from "vitest";
import { scoreSignals } from "../src";

describe("scoreSignals", () => {
  it("deduplicates signals and caps the score", () => {
    expect(scoreSignals(["new_warehouse", "new_warehouse"]).intentScore).toBe(
      30,
    );
    expect(
      scoreSignals([
        "new_warehouse",
        "new_fulfilment_centre",
        "warehouse_hiring",
        "automation_investment",
        "regional_expansion",
      ]).intentScore,
    ).toBe(100);
  });
  it("returns low priority when there is no warehouse evidence", () =>
    expect(scoreSignals([])).toMatchObject({
      intentScore: 0,
      intentBand: "low_priority",
    }));
});
