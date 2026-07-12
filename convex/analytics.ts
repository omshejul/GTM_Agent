import {
  analyticsEventNames,
  type AnalyticsEventName,
} from "@ai-gtm/contracts";
import {
  actionGeneric,
  internalMutationGeneric,
  makeFunctionReference,
  mutationGeneric,
} from "convex/server";
import { v } from "convex/values";
import { analyticsEventNameValidator } from "./validators";

const sensitiveKey = /source|article|prompt|secret|token|key|password|content/i;

const registerVisitorRef = makeFunctionReference<
  "mutation",
  { visitorId: string },
  null
>("analytics:registerVisitor");

export const createVisitor = actionGeneric({
  args: {},
  handler: async (ctx) => {
    const visitorId = crypto.randomUUID();
    await ctx.runMutation(registerVisitorRef, { visitorId });
    return { visitorId };
  },
});

export const registerVisitor = internalMutationGeneric({
  args: { visitorId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("visitors", {
      visitorId: args.visitorId,
      firstSeenAt: now,
      lastSeenAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      name: "visitor_started",
      properties: {},
      timestamp: now,
    });
    return null;
  },
});

export function sanitizeAnalyticsProperties(
  value: unknown,
): Record<string, string | number | boolean | null> {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Analytics properties must be an object");
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > 20)
    throw new Error("Analytics properties may have at most 20 fields");
  return Object.fromEntries(
    entries.map(([key, item]) => {
      if (sensitiveKey.test(key))
        throw new Error(`Sensitive analytics property is not allowed: ${key}`);
      if (
        item !== null &&
        !["string", "number", "boolean"].includes(typeof item)
      ) {
        throw new Error(`Analytics property ${key} must be a primitive`);
      }
      return [
        key.slice(0, 100),
        typeof item === "string" ? item.slice(0, 500) : item,
      ];
    }),
  ) as Record<string, string | number | boolean | null>;
}

export const trackEvent = mutationGeneric({
  args: {
    visitorId: v.optional(v.string()),
    name: analyticsEventNameValidator,
    properties: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!args.visitorId && !identity)
      throw new Error("visitorId or authenticated user is required");
    const name = args.name as AnalyticsEventName;
    if (!(analyticsEventNames as readonly string[]).includes(name))
      throw new Error("Invalid event name");
    const now = Date.now();
    if (name === "signup_completed" && identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_subject", (q) =>
          q.eq("identitySubject", identity.subject),
        )
        .unique();
      if (!user) {
        await ctx.db.insert("users", {
          identitySubject: identity.subject,
          signupAt: now,
        });
      }
    }
    if (args.visitorId) {
      const visitor = await ctx.db
        .query("visitors")
        .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId!))
        .unique();
      if (!visitor) throw new Error("Unknown visitor credential");
      await ctx.db.patch(visitor._id, { lastSeenAt: now });
    }
    return await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      userSubject: identity?.subject,
      name,
      properties: sanitizeAnalyticsProperties(args.properties),
      timestamp: now,
    });
  },
});
