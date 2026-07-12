import { describe, expect, it } from "vitest";
import { strongOpportunityFixture } from "../src";
import {
  generateDeterministicLeadRoast,
  moderateLeadRoast,
} from "../src/roast";

describe("lead roast", () => {
  it("returns structured evidence-grounded workplace-safe output", () => {
    expect(
      generateDeterministicLeadRoast(
        strongOpportunityFixture,
        "sales_team_spicy",
      ),
    ).toMatchObject({
      generationId: strongOpportunityFixture.id,
      tone: "sales_team_spicy",
      promptVersion: "v1",
      citedSignalIds: [
        "new_warehouse",
        "new_fulfilment_centre",
        "regional_expansion",
      ],
      aiGenerated: true,
    });
  });

  it("fails closed when the opportunity has no grounded signal", () => {
    expect(() =>
      generateDeterministicLeadRoast(
        { ...strongOpportunityFixture, signals: [], evidence: [] },
        "professional_wit",
      ),
    ).toThrow(/no grounded signal/i);
  });

  it("rejects unsafe workplace topics", () => {
    expect(() => moderateLeadRoast("A joke about layoffs and injury")).toThrow(
      /prohibited workplace-safety topic/,
    );
  });

  it("produces a distinct grounded variant when explicitly requested", () => {
    const first = generateDeterministicLeadRoast(
      strongOpportunityFixture,
      "professional_wit",
      0,
    );
    const variant = generateDeterministicLeadRoast(
      strongOpportunityFixture,
      "professional_wit",
      1,
    );
    expect(variant.oneLineRoast).not.toBe(first.oneLineRoast);
    expect(variant.citedSignalIds).toEqual(first.citedSignalIds);
  });
});
