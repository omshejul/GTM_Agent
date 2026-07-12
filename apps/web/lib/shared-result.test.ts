import { describe, expect, it } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { fetchSharedResult, metadataForSharedResult } from "./shared-result";

describe("shared result metadata", () => {
  it("keeps the fixture share URL valid without a Convex deployment", async () => {
    await expect(fetchSharedResult("demo-fixture-strong")).resolves.toEqual({
      result: strongOpportunityFixture,
      roast: null,
    });
  });
  it("uses only the immutable public snapshot", () => {
    expect(metadataForSharedResult(strongOpportunityFixture)).toMatchObject({
      title: `${strongOpportunityFixture.companyName} opportunity brief · AI GTM OS`,
      description: `Evidence-backed intent score: ${strongOpportunityFixture.intentScore}/100`,
      robots: { index: false, follow: false },
    });
  });
});
