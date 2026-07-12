import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { describe, expect, it, vi } from "vitest";
import { extractOpportunity } from "../ai";

const extracted = (({
  id: _id,
  scoreBreakdown: _breakdown,
  intentScore: _score,
  intentBand: _band,
  ...value
}) => ({
  ...value,
  signals: ["new_warehouse"] as const,
  evidence: [value.evidence[0]],
}))(strongOpportunityFixture);

describe("OpenAI structured-output request", () => {
  it("uses only JSON Schema keywords supported by OpenAI strict mode", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(extracted) } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    await extractOpportunity(
      {
        sellerSolution: "Warehouse Management System",
        sourceText:
          "The company announced a new fulfilment centre in Bengaluru.",
        researchWithLinkUp: false,
      },
      [],
      { apiKey: "test", model: "gpt-4.1-mini", fetcher },
    );
    const request = fetcher.mock.calls[0]![1]!;
    expect(String(request.body)).not.toContain("uniqueItems");
  });
});
