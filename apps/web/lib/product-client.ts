import type { AgentResult, GenerateOpportunityInput } from "@ai-gtm/contracts";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
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

export function getProductClient(): ProductClient {
  if (!browserClient) browserClient = createFixtureProductClient();
  return browserClient;
}
