import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import schema from "../schema";

type Glob = (pattern: string) => Record<string, () => Promise<unknown>>;
const modules = {
  ...(import.meta as unknown as { glob: Glob }).glob("../*.ts"),
  "../_generated/server.ts": async () => ({}),
};
const generateOpportunity = makeFunctionReference<"action">(
  "opportunities:generateOpportunity",
);

const extractedBase = (({
  id: _id,
  scoreBreakdown: _breakdown,
  intentScore: _score,
  intentBand: _band,
  ...value
}) => value)(strongOpportunityFixture);
const extracted = {
  ...extractedBase,
  signals: ["new_warehouse"],
  evidence: [extractedBase.evidence[0]],
};

describe("core pasted-text flow", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("works without authentication, visitor registration, or persistence", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "test-model";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [{ message: { content: JSON.stringify(extracted) } }],
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    const t = convexTest(schema, modules);
    const result = await t.action(generateOpportunity, {
      sellerSolution: "Warehouse Management System",
      sourceText: "The company announced a new fulfilment centre in Bengaluru.",
      researchWithLinkUp: false,
    });
    expect(result).toMatchObject({
      intentScore: 30,
      intentBand: "low_priority",
    });
    await t.run(async (ctx) => {
      expect(await ctx.db.query("generations").collect()).toHaveLength(0);
      expect(await ctx.db.query("opportunities").collect()).toHaveLength(0);
    });
  });
});
