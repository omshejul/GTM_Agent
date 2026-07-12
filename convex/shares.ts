import type { AgentResult, LeadRoast, LeadRoastTone } from "@ai-gtm/contracts";
import {
  actionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  makeFunctionReference,
} from "convex/server";
import { v } from "convex/values";

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

const authorizeRef = makeFunctionReference<
  "query",
  {
    generationId: string;
    ownerSubject?: string;
    visitorId?: string;
    roastTone?: LeadRoastTone;
  },
  { result: AgentResult; publicRoast?: LeadRoast } | null
>("shares:authorizeGenerationForShare");
const persistRef = makeFunctionReference<
  "mutation",
  {
    tokenHash: string;
    generationId: string;
    ownerSubject?: string;
    visitorId?: string;
    publicResult: AgentResult;
    publicRoast?: LeadRoast;
    expiresAt?: number;
  },
  string
>("shares:persistShare");
const lookupRef = makeFunctionReference<
  "query",
  { tokenHash: string },
  {
    publicResult: AgentResult;
    publicRoast?: LeadRoast;
    generationId: string;
    visitorId?: string;
  } | null
>("shares:lookupShare");
const viewedRef = makeFunctionReference<
  "mutation",
  { generationId: string; visitorId?: string },
  null
>("shares:recordShareView");
const revokeRef = makeFunctionReference<
  "mutation",
  { tokenHash: string; ownerSubject?: string; visitorId?: string },
  boolean
>("shares:revokeShareRecord");

export const createShare = actionGeneric({
  args: {
    generationId: v.string(),
    visitorId: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    roastTone: v.optional(
      v.union(
        v.literal("professional_wit"),
        v.literal("sales_team_spicy"),
        v.literal("workplace_safe_unhinged"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (args.expiresAt !== undefined && args.expiresAt <= Date.now()) {
      throw new Error("Share expiry must be in the future");
    }
    const authorized = await ctx.runQuery(authorizeRef, {
      generationId: args.generationId,
      ownerSubject: identity?.subject,
      visitorId: args.visitorId,
      roastTone: args.roastTone,
    });
    if (!authorized) throw new Error("Generation not found");
    const token = randomToken();
    await ctx.runMutation(persistRef, {
      tokenHash: await hashToken(token),
      generationId: args.generationId,
      ownerSubject: identity?.subject,
      visitorId: args.visitorId,
      publicResult: authorized.result,
      publicRoast: authorized.publicRoast,
      expiresAt: args.expiresAt,
    });
    return { token };
  },
});

export const getSharedResult = actionGeneric({
  args: { token: v.string(), visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const share = await ctx.runQuery(lookupRef, {
      tokenHash: await hashToken(args.token),
    });
    if (!share) return null;
    await ctx.runMutation(viewedRef, {
      generationId: share.generationId,
      visitorId: args.visitorId,
    });
    return { result: share.publicResult, roast: share.publicRoast ?? null };
  },
});

export const authorizeGenerationForShare = internalQueryGeneric({
  args: {
    generationId: v.string(),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    roastTone: v.optional(
      v.union(
        v.literal("professional_wit"),
        v.literal("sales_team_spicy"),
        v.literal("workplace_safe_unhinged"),
      ),
    ),
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
    const roast = args.roastTone
      ? await ctx.db
          .query("leadRoasts")
          .withIndex("by_scope", (q) =>
            q.eq("scope", `${args.generationId}:${args.roastTone}:v1`),
          )
          .unique()
      : null;
    return {
      result: generation.result as AgentResult,
      publicRoast: roast?.publicRoast as LeadRoast | undefined,
    };
  },
});

export const persistShare = internalMutationGeneric({
  args: {
    tokenHash: v.string(),
    generationId: v.string(),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    publicResult: v.any(),
    publicRoast: v.optional(v.any()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("shares", {
      ...args,
      generationId: args.generationId as never,
      createdAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      userSubject: args.ownerSubject,
      name: "share_created",
      properties: {},
      timestamp: now,
    });
    if (args.publicRoast) {
      const roast = args.publicRoast as LeadRoast;
      await ctx.db.insert("analyticsEvents", {
        visitorId: args.visitorId,
        userSubject: args.ownerSubject,
        name: "lead_roast_shared",
        properties: { tone: roast.tone, promptVersion: roast.promptVersion },
        timestamp: now,
      });
    }
    return String(id);
  },
});

export const lookupShare = internalQueryGeneric({
  args: { tokenHash: v.string() },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (
      !share ||
      share.revokedAt ||
      (share.expiresAt && share.expiresAt <= Date.now())
    )
      return null;
    return {
      publicResult: share.publicResult as AgentResult,
      publicRoast: share.publicRoast as LeadRoast | undefined,
      generationId: String(share.generationId),
      visitorId: share.visitorId,
    };
  },
});

export const recordShareView = internalMutationGeneric({
  args: { generationId: v.string(), visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      name: "share_viewed",
      properties: { generationId: args.generationId },
      timestamp: Date.now(),
    });
    return null;
  },
});

export const revokeShare = actionGeneric({
  args: { token: v.string(), visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    return await ctx.runMutation(revokeRef, {
      tokenHash: await hashToken(args.token),
      ownerSubject: identity?.subject,
      visitorId: args.visitorId,
    });
  },
});

export const revokeShareRecord = internalMutationGeneric({
  args: {
    tokenHash: v.string(),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("shares")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .unique();
    if (!share) return false;
    const allowed = share.ownerSubject
      ? share.ownerSubject === args.ownerSubject
      : Boolean(share.visitorId && share.visitorId === args.visitorId);
    if (!allowed) throw new Error("Share not found");
    await ctx.db.patch(share._id, { revokedAt: Date.now() });
    return true;
  },
});
