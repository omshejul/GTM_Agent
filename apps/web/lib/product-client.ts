import type { AgentResult, GenerateOpportunityInput } from "@ai-gtm/contracts";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { ConvexReactClient } from "convex/react";
import {
  makeFunctionReference,
  type DefaultFunctionArgs,
  type FunctionReference,
} from "convex/server";
import type { AnalyticsEvent, SafeEventProperties } from "./analytics-client";
import { createAnalyticsClient } from "./analytics-client";

export interface ProductClient {
  readonly mode: "fixture" | "convex";
  generateOpportunity(input: GenerateOpportunityInput): Promise<AgentResult>;
  createShare(resultId: string): Promise<{ token: string }>;
  startCheckout(): Promise<{ url: string }>;
  getEntitlement(): Promise<{ paid: boolean }>;
  trackEvent(event: AnalyticsEvent, properties?: SafeEventProperties): Promise<void>;
}

type PublicFunction<Kind extends "query" | "mutation" | "action", Args extends DefaultFunctionArgs, Result> =
  FunctionReference<Kind, "public", Args, Result>;

type GenerateArgs = {
  [Key in keyof GenerateOpportunityInput]: GenerateOpportunityInput[Key];
};

const convexFunctions = {
  generateOpportunity: makeFunctionReference<"action">("opportunities:generateOpportunity") as PublicFunction<"action", GenerateArgs, AgentResult>,
  createShare: makeFunctionReference<"mutation">("shares:createShare") as PublicFunction<"mutation", { resultId: string }, { token: string }>,
  startCheckout: makeFunctionReference<"action">("payments:startCheckout") as PublicFunction<"action", Record<string, never>, { url: string }>,
  getEntitlement: makeFunctionReference<"query">("payments:getEntitlement") as PublicFunction<"query", Record<string, never>, { paid: boolean }>,
  trackEvent: makeFunctionReference<"mutation">("analytics:trackEvent") as PublicFunction<"mutation", { event: AnalyticsEvent; visitorId: string; properties: SafeEventProperties }, null>,
};

let browserClient: ProductClient | null = null;
const memoryValues = new Map<string, string>();

function storage() {
  let persistent: Storage | undefined;
  try {
    if (process.env.NODE_ENV !== "test" && typeof window !== "undefined") {
      persistent = window.localStorage;
    }
  } catch {
    persistent = undefined;
  }

  return {
    getItem(key: string) {
      try {
        return persistent?.getItem(key) ?? memoryValues.get(key) ?? null;
      } catch {
        return memoryValues.get(key) ?? null;
      }
    },
    setItem(key: string, value: string) {
      try {
        persistent?.setItem(key, value);
      } catch {
        memoryValues.set(key, value);
      }
      if (!persistent) memoryValues.set(key, value);
    },
    removeItem(key: string) {
      try {
        persistent?.removeItem(key);
      } catch {
        // In-memory cleanup below keeps retries available.
      }
      memoryValues.delete(key);
    },
  };
}

export function createFixtureProductClient(): ProductClient {
  const browserStorage = storage();
  const analytics = typeof window === "undefined"
    ? null
    : createAnalyticsClient({
        storage: browserStorage,
        createId: () => globalThis.crypto?.randomUUID?.() ?? `visitor-${Date.now()}`,
        sink: async (payload) => {
          const key = "ai-gtm:analytics-log";
          const current = JSON.parse(browserStorage.getItem(key) ?? "[]") as unknown[];
          browserStorage.setItem(key, JSON.stringify([...current.slice(-49), payload]));
        },
      });

  return {
    mode: "fixture",
    async generateOpportunity(_input) {
      await Promise.resolve();
      return strongOpportunityFixture;
    },
    async createShare(resultId) {
      browserStorage.setItem(`ai-gtm:share:${resultId}`, "public");
      return { token: `demo-${resultId}` };
    },
    async startCheckout() {
      throw { code: "REVENUE_NOT_CONFIGURED" };
    },
    async getEntitlement() {
      return { paid: false };
    },
    async trackEvent(event, properties = {}) {
      await analytics?.track(event, properties);
    },
  };
}

export function createConvexProductClient(url: string): ProductClient {
  const convex = new ConvexReactClient(url);
  const analytics = createAnalyticsClient({
    storage: storage(),
    createId: () => globalThis.crypto?.randomUUID?.() ?? `visitor-${Date.now()}`,
    sink: async (payload) => {
      await convex.mutation(convexFunctions.trackEvent, payload);
    },
  });

  return {
    mode: "convex",
    generateOpportunity: (input) => convex.action(convexFunctions.generateOpportunity, input),
    createShare: (resultId) => convex.mutation(convexFunctions.createShare, { resultId }),
    startCheckout: () => convex.action(convexFunctions.startCheckout, {}),
    getEntitlement: () => convex.query(convexFunctions.getEntitlement, {}),
    trackEvent: (event, properties = {}) => analytics.track(event, properties),
  };
}

export function getProductClient(): ProductClient {
  if (!browserClient) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
    browserClient = convexUrl
      ? createConvexProductClient(convexUrl)
      : createFixtureProductClient();
  }
  return browserClient;
}
