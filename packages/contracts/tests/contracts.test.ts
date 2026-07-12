import { describe, expect, it } from "vitest";
import {
  AgentContractError,
  analyticsEventNames,
  parseAgentResult,
  parseGenerateOpportunityInput,
  strongOpportunityFixture,
} from "../src";

describe("parseGenerateOpportunityInput", () => {
  it("trims valid input and accepts pasted source text", () => {
    expect(
      parseGenerateOpportunityInput({
        sellerSolution: "  Warehouse Management System  ",
        sourceText:
          "  A sufficiently detailed announcement about a new facility.  ",
        researchWithLinkUp: false,
      }),
    ).toMatchObject({
      sellerSolution: "Warehouse Management System",
      sourceText: "A sufficiently detailed announcement about a new facility.",
    });
  });

  it("requires a source that can be processed with the selected mode", () => {
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        researchWithLinkUp: false,
      }),
    ).toThrowError(AgentContractError);
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        companyName: "Acme",
        researchWithLinkUp: false,
      }),
    ).toThrowError(/LinkUp research/);
  });

  it("rejects invalid URLs and oversized input", () => {
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        sourceUrl: "javascript:alert(1)",
        researchWithLinkUp: true,
      }),
    ).toThrowError(/HTTP/);
    expect(() =>
      parseGenerateOpportunityInput({
        sellerSolution: "Warehouse Management System",
        sourceText: "x".repeat(50_001),
        researchWithLinkUp: false,
      }),
    ).toThrowError(/50,000/);
  });
});

describe("parseAgentResult", () => {
  it("accepts the shared fixture", () => {
    expect(parseAgentResult(strongOpportunityFixture)).toEqual(
      strongOpportunityFixture,
    );
  });

  it("rejects out-of-range values and ungrounded citation indexes", () => {
    expect(() =>
      parseAgentResult({ ...strongOpportunityFixture, confidence: 1.1 }),
    ).toThrow(/confidence/);
    expect(() =>
      parseAgentResult({
        ...strongOpportunityFixture,
        evidence: [
          { text: "Claim", signal: "new_warehouse", citationIndex: 4 },
        ],
      }),
    ).toThrow(/citationIndex/);
  });
});

describe("analytics event vocabulary", () => {
  it("is frozen to the MVP event names", () => {
    expect(analyticsEventNames).toEqual([
      "visitor_started",
      "signup_completed",
      "generation_started",
      "generation_completed",
      "generation_failed",
      "share_created",
      "share_viewed",
      "lead_roast_generated",
      "lead_roast_shared",
    ]);
  });
});
