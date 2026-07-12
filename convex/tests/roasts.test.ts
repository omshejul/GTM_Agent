import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";
import schema from "../schema";

type Glob = (pattern: string) => Record<string, () => Promise<unknown>>;
const modules = {
  ...(import.meta as unknown as { glob: Glob }).glob("../*.ts"),
  "../_generated/server.ts": async () => ({}),
};
const registerVisitor = makeFunctionReference<"mutation">(
  "analytics:registerVisitor",
);
const startGeneration = makeFunctionReference<"mutation">(
  "generations:startGeneration",
);
const completeGeneration = makeFunctionReference<"mutation">(
  "generations:completeGeneration",
);
const generateLeadRoast = makeFunctionReference<"action">(
  "roasts:generateLeadRoast",
);
const createShare = makeFunctionReference<"action">("shares:createShare");
const getSharedResult = makeFunctionReference<"action">(
  "shares:getSharedResult",
);
const revokeShare = makeFunctionReference<"action">("shares:revokeShare");

const extracted = (({
  id: _id,
  scoreBreakdown: _breakdown,
  intentScore: _score,
  intentBand: _band,
  ...value
}) => value)(strongOpportunityFixture);

describe("generateLeadRoast", () => {
  it("persists and returns an idempotent evidence-grounded roast", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(registerVisitor, { visitorId: "roast-visitor" });
    const started = await t.mutation(startGeneration, {
      input: {
        sellerSolution: "Warehouse Management System",
        sourceText:
          "The company announced a new fulfilment centre in Bengaluru.",
        researchWithLinkUp: false,
        visitorId: "roast-visitor",
      },
      visitorId: "roast-visitor",
    });
    await t.mutation(completeGeneration, {
      generationId: started.generationId,
      extracted,
      model: "test-model",
      providerBaseUrl: "https://api.openai.com",
      researchSourceCount: 0,
    });
    const args = {
      generationId: started.generationId,
      tone: "professional_wit",
      visitorId: "roast-visitor",
    };
    const first = await t.action(generateLeadRoast, args);
    const second = await t.action(generateLeadRoast, args);
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      tone: "professional_wit",
      citedSignalIds: [
        "new_warehouse",
        "new_fulfilment_centre",
        "regional_expansion",
      ],
      aiGenerated: true,
    });
    await t.run(async (ctx) => {
      expect(await ctx.db.query("leadRoasts").collect()).toHaveLength(1);
      const events = await ctx.db.query("analyticsEvents").collect();
      expect(
        events.filter((event) => event.name === "lead_roast_generated"),
      ).toHaveLength(1);
    });
    const variant = await t.action(generateLeadRoast, {
      ...args,
      newVariant: true,
    });
    expect(variant.oneLineRoast).not.toBe(first.oneLineRoast);
    const { token } = await t.action(createShare, {
      generationId: started.generationId,
      visitorId: "roast-visitor",
    });
    await expect(t.action(getSharedResult, { token })).resolves.toMatchObject({
      result: { id: started.generationId },
      roast: variant,
    });
    await t.run(async (ctx) => {
      const share = (await ctx.db.query("shares").collect())[0]!;
      expect(share.publicRoast).toEqual(variant);
      const events = await ctx.db.query("analyticsEvents").collect();
      expect(
        events.filter((event) => event.name === "lead_roast_shared"),
      ).toHaveLength(1);
    });
    await expect(
      t.action(revokeShare, { token, visitorId: "roast-visitor" }),
    ).resolves.toBe(true);
    await expect(t.action(getSharedResult, { token })).resolves.toBeNull();
  });
});
