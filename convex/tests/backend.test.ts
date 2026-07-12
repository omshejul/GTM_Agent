import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import schema from "../schema";

type Glob = (pattern: string) => Record<string, () => Promise<unknown>>;
const modules = {
  ...(import.meta as unknown as { glob: Glob }).glob("../*.ts"),
  // convex-test uses this marker to identify the functions-directory root.
  "../_generated/server.ts": async () => ({}),
};
const trackEvent = makeFunctionReference<"mutation">("analytics:trackEvent");
const getOpportunity = makeFunctionReference<"query">(
  "opportunities:getOpportunity",
);
const processWebhook = makeFunctionReference<"mutation">(
  "payments:processWebhook",
);
const startGeneration = makeFunctionReference<"mutation">(
  "generations:startGeneration",
);
const registerVisitor = makeFunctionReference<"mutation">(
  "analytics:registerVisitor",
);
const completeGeneration = makeFunctionReference<"mutation">(
  "generations:completeGeneration",
);

const input = {
  sellerSolution: "WMS",
  sourceText: "Acme opened a warehouse.",
  researchWithLinkUp: false,
  visitorId: "visitor-a",
  idempotencyKey: "request-a",
};

const extracted = (({
  id: _id,
  scoreBreakdown: _breakdown,
  intentScore: _score,
  intentBand: _band,
  ...value
}) => value)(strongOpportunityFixture);

describe("Convex persistence and authorization", () => {
  it("persists a scored generation idempotently and protects the opportunity", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(registerVisitor, { visitorId: "visitor-a" });
    const started = await t.mutation(startGeneration, {
      input,
      visitorId: "visitor-a",
    });
    const result = await t.mutation(completeGeneration, {
      generationId: started.generationId,
      extracted,
      model: "test-model",
      providerBaseUrl: "https://api.openai.com",
      researchSourceCount: 0,
    });
    expect(result.intentScore).toBe(70);
    const opportunityId = await t.run(async (ctx) => {
      const rows = await ctx.db.query("opportunities").collect();
      expect(rows).toHaveLength(1);
      return rows[0]!._id;
    });
    await expect(
      t.query(getOpportunity, { id: opportunityId, visitorId: "visitor-b" }),
    ).resolves.toBeNull();
    await expect(
      t.query(getOpportunity, { id: opportunityId, visitorId: "visitor-a" }),
    ).resolves.toMatchObject({
      intentScore: 70,
    });
    const retried = await t.mutation(startGeneration, {
      input,
      visitorId: "visitor-a",
    });
    expect(retried.existingResult).toEqual(result);
  });

  it("rejects caller-invented anonymous visitor credentials", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(startGeneration, { input, visitorId: "invented-visitor" }),
    ).rejects.toThrow(/visitor credential/i);
  });

  it("reuses a failed idempotent generation instead of inserting a duplicate", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(registerVisitor, { visitorId: "visitor-a" });
    const started = await t.mutation(startGeneration, {
      input,
      visitorId: "visitor-a",
    });
    await t.run(async (ctx) => {
      await ctx.db.patch(started.generationId, {
        status: "failed",
        errorCode: "AI_FAILED",
      });
    });
    const retried = await t.mutation(startGeneration, {
      input,
      visitorId: "visitor-a",
    });
    expect(retried.generationId).toBe(started.generationId);
    await t.run(async (ctx) => {
      expect(await ctx.db.query("generations").collect()).toHaveLength(1);
    });
  });

  it("rejects sensitive analytics properties", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(registerVisitor, { visitorId: "visitor-a" });
    await expect(
      t.mutation(trackEvent, {
        visitorId: "visitor-a",
        name: "generation_started",
        properties: { sourceText: "private article" },
      }),
    ).rejects.toThrow(/Sensitive analytics property/);
  });

  it("upserts the authenticated user when signup completes", async () => {
    const t = convexTest(schema, modules).withIdentity({ subject: "user-1" });
    await t.mutation(trackEvent, { name: "signup_completed" });
    await t.mutation(trackEvent, { name: "signup_completed" });
    await t.run(async (ctx) => {
      const users = await ctx.db.query("users").collect();
      expect(users).toHaveLength(1);
      expect(users[0]).toMatchObject({ identitySubject: "user-1" });
    });
  });

  it("processes each payment webhook event only once", async () => {
    const t = convexTest(schema, modules);
    const args = {
      providerEventId: "evt_1",
      eventType: "subscription.active",
      ownerSubject: "user-1",
      subscriptionId: "sub-1",
      productId: "product-1",
      status: "active",
      entitled: true,
      providerEventAt: 200,
    };
    await expect(t.mutation(processWebhook, args)).resolves.toEqual({
      duplicate: false,
      stale: false,
    });
    await expect(t.mutation(processWebhook, args)).resolves.toEqual({
      duplicate: true,
    });
    await t.run(async (ctx) => {
      expect(await ctx.db.query("webhookEvents").collect()).toHaveLength(1);
      expect(await ctx.db.query("subscriptions").collect()).toHaveLength(1);
    });
    await expect(
      t.mutation(processWebhook, {
        ...args,
        providerEventId: "evt_older",
        status: "cancelled",
        entitled: false,
        providerEventAt: 100,
      }),
    ).resolves.toEqual({ duplicate: false, stale: true });
    await t.run(async (ctx) => {
      const subscription = (await ctx.db.query("subscriptions").collect())[0]!;
      expect(subscription).toMatchObject({ status: "active", entitled: true });
    });
  });
});
