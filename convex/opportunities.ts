import { queryGeneric } from "convex/server";
import { v } from "convex/values";

// Stable frontend entry point: api.opportunities.generateOpportunity.
export { generateOpportunity } from "./generations";

function canRead(
  record: { ownerSubject?: string; visitorId?: string },
  identitySubject: string | undefined,
  visitorId: string | undefined,
) {
  if (record.ownerSubject) return record.ownerSubject === identitySubject;
  return Boolean(
    record.visitorId && visitorId && record.visitorId === visitorId,
  );
}

export const getOpportunity = queryGeneric({
  args: { id: v.id("opportunities"), visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const opportunity = await ctx.db.get(args.id);
    if (
      !opportunity ||
      !canRead(opportunity, identity?.subject, args.visitorId)
    )
      return null;
    return opportunity;
  },
});

export const listMyOpportunities = queryGeneric({
  args: { visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      return await ctx.db
        .query("opportunities")
        .withIndex("by_owner", (q) => q.eq("ownerSubject", identity.subject))
        .order("desc")
        .take(50);
    }
    if (!args.visitorId) return [];
    return await ctx.db
      .query("opportunities")
      .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId))
      .order("desc")
      .take(50);
  },
});
