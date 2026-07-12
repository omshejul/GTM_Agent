import { describe, expect, it } from "vitest";
import {
  demoOpportunityFixtures,
  parseGenerateOpportunityInput,
  recommendForSignals,
  scoreSignals,
} from "../src";

describe("revised India-first Plan A contract", () => {
  it("accepts controlled ICP values and targetState", () => {
    expect(
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Automation",
        targetIndustry: "Logistics",
        targetState: "Karnataka",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toMatchObject({ targetIndustry: "Logistics", targetState: "Karnataka" });
    expect(
      parseGenerateOpportunityInput({
        sellerSolution: "Inventory Software",
        targetIndustry: "Retail",
        targetState: "Kerala",
        targetRegion: "South India",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toMatchObject({ targetState: "Kerala", targetRegion: "South India" });
  });

  it("rejects unsupported controlled ICP values", () => {
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Cryptocurrency",
        targetIndustry: "Logistics",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toThrow(/sellerSolution/);
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        targetIndustry: "Healthcare",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toThrow(/targetIndustry/);
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        targetRegion: "California",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toThrow(/targetRegion/);
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Custom:",
        sourceText: "A sufficiently detailed public warehouse announcement.",
        researchWithLinkUp: false,
      }),
    ).toThrow(/sellerSolution/);
  });

  it("uses the revised weights and priority boundaries", () => {
    expect(scoreSignals([]).intentBand).toBe("low_priority");
    expect(
      scoreSignals(["new_warehouse", "funding_announcement"]).intentBand,
    ).toBe("medium_priority");
    expect(
      scoreSignals([
        "new_warehouse",
        "new_fulfilment_centre",
        "regional_expansion",
      ]),
    ).toMatchObject({ intentScore: 70, intentBand: "high_priority" });
  });

  it("uses deterministic recommendation rules", () => {
    expect(recommendForSignals(["automation_investment"])).toMatchObject({
      recommendedSolution: "Robotics or Warehouse Automation",
      recommendedContactRole: "Operations Director",
    });
    expect(recommendForSignals(["inventory_pressure"])).toMatchObject({
      recommendedSolution: "Inventory Software",
      recommendedContactRole: "Supply Chain Manager",
    });
  });

  it("provides five safe India-focused demo scenarios", () => {
    expect(demoOpportunityFixtures).toHaveLength(5);
    expect(demoOpportunityFixtures.every((fixture) => fixture.fictional)).toBe(
      true,
    );
  });
});
