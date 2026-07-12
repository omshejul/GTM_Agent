import { cache } from "react";
import type { Metadata } from "next";
import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference, type FunctionReference } from "convex/server";
import {
  strongOpportunityFixture,
  type AgentResult,
  type LeadRoast,
} from "@ai-gtm/contracts";

export interface SharedResultSnapshot {
  result: AgentResult;
  roast: LeadRoast | null;
}

const getSharedResult = makeFunctionReference<"action">(
  "shares:getSharedResult",
) as FunctionReference<
  "action",
  "public",
  { token: string },
  SharedResultSnapshot | null
>;

export const fetchSharedResult = cache(async (token: string) => {
  if (token === `demo-${strongOpportunityFixture.id}`) {
    return { result: strongOpportunityFixture, roast: null };
  }
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (!convexUrl) return null;
  const client = new ConvexHttpClient(convexUrl);
  return client.action(getSharedResult, { token });
});

export function metadataForSharedResult(result: AgentResult): Metadata {
  return {
    title: `${result.companyName ?? "Shared"} opportunity brief · AI GTM OS`,
    description: `Evidence-backed intent score: ${result.intentScore}/100`,
    robots: { index: false, follow: false },
  };
}
