import {
  generateDeterministicLeadRoast,
  type AgentResult,
  type LeadRoast,
  type LeadRoastTone,
} from "@ai-gtm/contracts";
import {
  actionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  makeFunctionReference,
} from "convex/server";
import { ConvexError, v } from "convex/values";

const toneValidator = v.union(
  v.literal("professional_wit"),
  v.literal("sales_team_spicy"),
  v.literal("workplace_safe_unhinged"),
);

const prepareRef = makeFunctionReference<
  "query",
  {
    generationId: string;
    tone: LeadRoastTone;
    ownerSubject?: string;
    visitorId?: string;
  },
  {
    result: AgentResult;
    existing?: LeadRoast;
    ownerSubject?: string;
    visitorId?: string;
  } | null
>("roasts:prepareLeadRoast");
const persistRef = makeFunctionReference<
  "mutation",
  {
    generationId: string;
    scope: string;
    tone: LeadRoastTone;
    ownerSubject?: string;
    visitorId?: string;
    roast: LeadRoast;
  },
  LeadRoast
>("roasts:persistLeadRoast");

export const generateLeadRoast = actionGeneric({
  args: {
    generationId: v.string(),
    tone: toneValidator,
    visitorId: v.optional(v.string()),
    newVariant: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const prepared = await ctx.runQuery(prepareRef, {
      generationId: args.generationId,
      tone: args.tone,
      ownerSubject: identity?.subject,
      visitorId: args.visitorId,
    });
    if (!prepared) throw new ConvexError({ code: "GENERATION_NOT_FOUND" });
    if (prepared.existing && !args.newVariant) return prepared.existing;
    let roast: LeadRoast;
    const variant = args.newVariant ? 1 + (Date.now() % 2) : 0;
    try {
      roast = generateDeterministicLeadRoast(
        prepared.result,
        args.tone,
        variant,
      );
    } catch (error) {
      const code =
        error instanceof Error && "code" in error
          ? String((error as Error & { code: string }).code)
          : "UNSAFE_ROAST_OUTPUT";
      throw new ConvexError({
        code,
        message: error instanceof Error ? error.message : code,
      });
    }
    const baseScope = `${args.generationId}:${args.tone}:v1`;
    return await ctx.runMutation(persistRef, {
      generationId: args.generationId,
      scope: args.newVariant ? `${baseScope}:${Date.now()}` : baseScope,
      tone: args.tone,
      ownerSubject: prepared.ownerSubject,
      visitorId: prepared.visitorId,
      roast,
    });
  },
});

export const prepareLeadRoast = internalQueryGeneric({
  args: {
    generationId: v.string(),
    tone: toneValidator,
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId as never);
    if (!generation?.result || generation.status !== "completed") return null;
    const allowed = generation.ownerSubject
      ? generation.ownerSubject === args.ownerSubject
      : Boolean(
          generation.visitorId && generation.visitorId === args.visitorId,
        );
    if (!allowed) return null;
    const scope = `${args.generationId}:${args.tone}:v1`;
    const existing = await ctx.db
      .query("leadRoasts")
      .withIndex("by_scope", (q) => q.eq("scope", scope))
      .unique();
    return {
      result: generation.result as AgentResult,
      existing: existing?.publicRoast as LeadRoast | undefined,
      ownerSubject: generation.ownerSubject,
      visitorId: generation.visitorId,
    };
  },
});

export const persistLeadRoast = internalMutationGeneric({
  args: {
    generationId: v.string(),
    scope: v.string(),
    tone: toneValidator,
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    roast: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("leadRoasts")
      .withIndex("by_scope", (q) => q.eq("scope", args.scope))
      .unique();
    if (existing) return existing.publicRoast as LeadRoast;
    const recent = args.ownerSubject
      ? await ctx.db
          .query("leadRoasts")
          .withIndex("by_owner", (q) => q.eq("ownerSubject", args.ownerSubject))
          .order("desc")
          .take(5)
      : await ctx.db
          .query("leadRoasts")
          .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
          .order("desc")
          .take(5);
    if (recent.length === 5 && recent[4]!.createdAt > Date.now() - 60_000) {
      throw new ConvexError({ code: "ROAST_RATE_LIMITED" });
    }
    const now = Date.now();
    await ctx.db.insert("leadRoasts", {
      generationId: args.generationId as never,
      ownerSubject: args.ownerSubject,
      visitorId: args.visitorId,
      scope: args.scope,
      tone: args.tone,
      promptVersion: "v1",
      publicRoast: args.roast,
      createdAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      userSubject: args.ownerSubject,
      name: "lead_roast_generated",
      properties: { tone: args.tone, promptVersion: "v1" },
      timestamp: now,
    });
    return args.roast as LeadRoast;
  },
});
