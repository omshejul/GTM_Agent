import {
  parseAgentResult,
  recommendForSignals,
  type AgentResult,
  type ExtractedOpportunity,
  type GenerateOpportunityInput,
} from "@ai-gtm/contracts";
import {
  actionGeneric,
  internalMutationGeneric,
  makeFunctionReference,
  queryGeneric,
} from "convex/server";
import { ConvexError, v } from "convex/values";
import { extractOpportunity, AgentServiceError } from "./ai";
import { researchCompany } from "./research";
import { scoreSignals } from "./scoring";
import { generateOpportunityArgs } from "./validators";

const startRef = makeFunctionReference<
  "mutation",
  {
    input: GenerateOpportunityInput;
    ownerSubject?: string;
    visitorId?: string;
  },
  { generationId: string; existingResult?: AgentResult }
>("generations:startGeneration");
const completeRef = makeFunctionReference<
  "mutation",
  {
    generationId: string;
    extracted: ExtractedOpportunity;
    model: string;
    providerBaseUrl: string;
    researchSourceCount: number;
  },
  AgentResult
>("generations:completeGeneration");
const failRef = makeFunctionReference<
  "mutation",
  { generationId: string; errorCode: string },
  null
>("generations:failGeneration");

export const generateOpportunity = actionGeneric({
  args: generateOpportunityArgs,
  handler: async (ctx, rawInput): Promise<AgentResult> => {
    let input: GenerateOpportunityInput;
    try {
      const { parseGenerateOpportunityInput } =
        await import("@ai-gtm/contracts");
      input = parseGenerateOpportunityInput(rawInput);
    } catch (error) {
      throw new ConvexError({
        code: "INVALID_INPUT",
        message:
          error instanceof Error ? error.message : "Invalid generation input",
        recoverable: true,
      });
    }
    const identity = await ctx.auth.getUserIdentity();
    const shouldPersist = Boolean(identity?.subject || input.visitorId);
    const started = shouldPersist
      ? await ctx.runMutation(startRef, {
          input,
          ownerSubject: identity?.subject,
          visitorId: input.visitorId,
        })
      : undefined;
    if (started?.existingResult) return started.existingResult;
    try {
      const research = await researchCompany(input);
      const extracted = await extractOpportunity(input, research);
      if (!started) {
        return parseAgentResult({
          ...extracted,
          ...recommendForSignals(extracted.signals),
          id: crypto.randomUUID(),
          ...scoreSignals(extracted.signals),
        });
      }
      return await ctx.runMutation(completeRef, {
        generationId: started.generationId,
        extracted,
        model: process.env.OPENAI_MODEL ?? "unknown",
        providerBaseUrl: new URL(
          process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
        ).origin,
        researchSourceCount: research.length,
      });
    } catch (error) {
      const serviceError =
        error instanceof AgentServiceError
          ? error
          : new AgentServiceError(
              "AI_FAILED",
              "Generation could not be completed",
              true,
            );
      if (started) {
        await ctx.runMutation(failRef, {
          generationId: started.generationId,
          errorCode: serviceError.code,
        });
      }
      throw new ConvexError({
        code: serviceError.code,
        message: serviceError.message,
        recoverable: serviceError.recoverable,
      });
    }
  },
});

export const startGeneration = internalMutationGeneric({
  args: {
    input: v.any(),
    ownerSubject: v.optional(v.string()),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.ownerSubject) {
      if (!args.visitorId)
        throw new Error("A server-issued visitor credential is required");
      const visitor = await ctx.db
        .query("visitors")
        .withIndex("by_visitor", (q) => q.eq("visitorId", args.visitorId!))
        .unique();
      if (!visitor) throw new Error("Unknown visitor credential");
    }
    const idempotencyScope = args.input.idempotencyKey
      ? `${args.ownerSubject ? `user:${args.ownerSubject}` : `visitor:${args.visitorId}`}:${args.input.idempotencyKey}`
      : undefined;
    if (idempotencyScope) {
      const existing = await ctx.db
        .query("generations")
        .withIndex("by_idempotency_scope", (q) =>
          q.eq("idempotencyScope", idempotencyScope),
        )
        .unique();
      if (existing) {
        if (existing.status === "completed" && existing.result) {
          return {
            generationId: String(existing._id),
            existingResult: parseAgentResult(existing.result),
          };
        }
        if (existing.status === "started")
          throw new Error("Generation is already in progress");
        await ctx.db.patch(existing._id, {
          input: args.input,
          status: "started",
          errorCode: undefined,
          completedAt: undefined,
        });
        return { generationId: String(existing._id) };
      }
    }
    const now = Date.now();
    const generationId = await ctx.db.insert("generations", {
      ownerSubject: args.ownerSubject,
      visitorId: args.visitorId,
      idempotencyKey: args.input.idempotencyKey,
      idempotencyScope,
      input: args.input,
      status: "started",
      createdAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: args.visitorId,
      userSubject: args.ownerSubject,
      name: "generation_started",
      properties: {},
      timestamp: now,
    });
    return { generationId: String(generationId) };
  },
});

export const completeGeneration = internalMutationGeneric({
  args: {
    generationId: v.string(),
    extracted: v.any(),
    model: v.string(),
    providerBaseUrl: v.string(),
    researchSourceCount: v.number(),
  },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId as never);
    if (!generation) throw new Error("Generation not found");
    if (generation.status === "completed" && generation.result)
      return parseAgentResult(generation.result);
    const result = parseAgentResult({
      ...args.extracted,
      ...recommendForSignals(args.extracted.signals),
      id: args.generationId,
      ...scoreSignals(args.extracted.signals),
    });
    const now = Date.now();
    await ctx.db.patch(generation._id, {
      result,
      status: "completed",
      model: args.model,
      providerBaseUrl: args.providerBaseUrl,
      researchSourceCount: args.researchSourceCount,
      completedAt: now,
    });
    const { id: _resultId, ...opportunityResult } = result;
    await ctx.db.insert("opportunities", {
      ownerSubject: generation.ownerSubject,
      visitorId: generation.visitorId,
      generationId: generation._id,
      ...opportunityResult,
      createdAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: generation.visitorId,
      userSubject: generation.ownerSubject,
      name: "generation_completed",
      properties: {
        intentScore: result.intentScore,
        signalCount: result.signals.length,
      },
      timestamp: now,
    });
    return result;
  },
});

export const failGeneration = internalMutationGeneric({
  args: { generationId: v.string(), errorCode: v.string() },
  handler: async (ctx, args) => {
    const generation = await ctx.db.get(args.generationId as never);
    if (!generation || generation.status === "completed") return null;
    const now = Date.now();
    await ctx.db.patch(generation._id, {
      status: "failed",
      errorCode: args.errorCode,
      completedAt: now,
    });
    await ctx.db.insert("analyticsEvents", {
      visitorId: generation.visitorId,
      userSubject: generation.ownerSubject,
      name: "generation_failed",
      properties: { errorCode: args.errorCode },
      timestamp: now,
    });
    return null;
  },
});

export const getGeneration = queryGeneric({
  args: { id: v.id("generations"), visitorId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const generation = await ctx.db.get(args.id);
    if (!generation) return null;
    const allowed = generation.ownerSubject
      ? generation.ownerSubject === identity?.subject
      : Boolean(
          generation.visitorId && generation.visitorId === args.visitorId,
        );
    return allowed ? generation : null;
  },
});
