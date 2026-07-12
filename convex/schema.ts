import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const nullableString = v.union(v.string(), v.null());
const owner = {
  ownerSubject: v.optional(v.string()),
  visitorId: v.optional(v.string()),
};

export default defineSchema({
  visitors: defineTable({
    visitorId: v.string(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    attribution: v.optional(v.record(v.string(), v.string())),
  }).index("by_visitor", ["visitorId"]),
  users: defineTable({
    identitySubject: v.string(),
    signupAt: v.number(),
  }).index("by_subject", ["identitySubject"]),
  opportunities: defineTable({
    ...owner,
    generationId: v.id("generations"),
    companyName: nullableString,
    industry: nullableString,
    eventType: nullableString,
    location: nullableString,
    eventDate: nullableString,
    signals: v.array(v.string()),
    evidence: v.array(v.any()),
    citations: v.array(v.any()),
    scoreBreakdown: v.array(v.any()),
    intentScore: v.number(),
    intentBand: v.string(),
    recommendedSolution: v.string(),
    reasoning: v.string(),
    recommendedContactRole: v.string(),
    nextAction: v.string(),
    linkedinMessage: v.string(),
    emailOpener: v.string(),
    confidence: v.number(),
    createdAt: v.number(),
  })
    .index("by_generation", ["generationId"])
    .index("by_owner", ["ownerSubject"])
    .index("by_visitor", ["visitorId"]),
  generations: defineTable({
    ...owner,
    idempotencyKey: v.optional(v.string()),
    idempotencyScope: v.optional(v.string()),
    input: v.any(),
    result: v.optional(v.any()),
    model: v.optional(v.string()),
    providerBaseUrl: v.optional(v.string()),
    researchSourceCount: v.optional(v.number()),
    status: v.union(
      v.literal("started"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    errorCode: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_idempotency_scope", ["idempotencyScope"])
    .index("by_owner", ["ownerSubject"])
    .index("by_visitor", ["visitorId"]),
  analyticsEvents: defineTable({
    visitorId: v.optional(v.string()),
    userSubject: v.optional(v.string()),
    name: v.string(),
    properties: v.optional(v.record(v.string(), v.any())),
    timestamp: v.number(),
  }).index("by_name_time", ["name", "timestamp"]),
  shares: defineTable({
    tokenHash: v.string(),
    generationId: v.id("generations"),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    publicResult: v.any(),
    publicRoast: v.optional(v.any()),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  }).index("by_token_hash", ["tokenHash"]),
  leadRoasts: defineTable({
    generationId: v.id("generations"),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    scope: v.string(),
    tone: v.string(),
    promptVersion: v.string(),
    publicRoast: v.any(),
    createdAt: v.number(),
  })
    .index("by_scope", ["scope"])
    .index("by_generation", ["generationId"])
    .index("by_owner", ["ownerSubject"])
    .index("by_visitor", ["visitorId"]),
  subscriptions: defineTable({
    ownerSubject: v.string(),
    dodoCustomerId: v.optional(v.string()),
    dodoSubscriptionId: v.optional(v.string()),
    dodoProductId: v.optional(v.string()),
    status: v.string(),
    entitled: v.boolean(),
    lastProviderEventAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerSubject"])
    .index("by_subscription", ["dodoSubscriptionId"]),
  webhookEvents: defineTable({
    provider: v.literal("dodo"),
    providerEventId: v.string(),
    eventType: v.string(),
    status: v.union(
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed"),
    ),
    receivedAt: v.number(),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
  }).index("by_provider_event", ["providerEventId"]),
});
