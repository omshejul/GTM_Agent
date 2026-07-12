import { v } from "convex/values";

export const generateOpportunityArgs = {
  sellerSolution: v.string(),
  targetIndustry: v.optional(v.string()),
  targetRegion: v.optional(v.string()),
  targetState: v.optional(v.string()),
  sourceText: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  companyName: v.optional(v.string()),
  researchWithLinkUp: v.boolean(),
  visitorId: v.optional(v.string()),
  idempotencyKey: v.optional(v.string()),
};

export const analyticsEventNameValidator = v.union(
  v.literal("visitor_started"),
  v.literal("signup_completed"),
  v.literal("generation_started"),
  v.literal("generation_completed"),
  v.literal("generation_failed"),
  v.literal("share_created"),
  v.literal("share_viewed"),
  v.literal("lead_roast_generated"),
  v.literal("lead_roast_shared"),
);
