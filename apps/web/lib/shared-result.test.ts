import { describe, expect, it } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { metadataForSharedResult } from "./shared-result";

describe("shared result metadata", () => {
  it("uses only the immutable public snapshot", () => {
    expect(metadataForSharedResult(strongOpportunityFixture)).toMatchObject({
      title: `${strongOpportunityFixture.companyName} opportunity brief · AI GTM OS`,
      description: `Evidence-backed intent score: ${strongOpportunityFixture.intentScore}/100`,
      robots: { index: false, follow: false },
    });
  });
});
