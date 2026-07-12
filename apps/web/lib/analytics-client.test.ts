import { describe, expect, it, vi } from "vitest";
import { createAnalyticsClient, getOrCreateVisitorId, type KeyValueStorage } from "./analytics-client";

function memoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("visitor analytics", () => {
  it("persists a privacy-safe anonymous visitor id", () => {
    const storage = memoryStorage();
    const createId = vi.fn(() => "anonymous-id");
    expect(getOrCreateVisitorId(storage, createId)).toBe("anonymous-id");
    expect(getOrCreateVisitorId(storage, createId)).toBe("anonymous-id");
    expect(createId).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent calls before the sink resolves", async () => {
    const storage = memoryStorage();
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const sink = vi.fn(() => pending);
    const analytics = createAnalyticsClient({ storage, sink, createId: () => "visitor-1" });

    const first = analytics.track("share_viewed", { scope: "token-1" });
    const second = analytics.track("share_viewed", { scope: "token-1" });
    expect(sink).toHaveBeenCalledTimes(1);
    release();
    await Promise.all([first, second]);
  });

  it("deduplicates events by event and scope without sending sensitive content", async () => {
    const storage = memoryStorage();
    const sink = vi.fn(async () => undefined);
    const analytics = createAnalyticsClient({ storage, sink, createId: () => "visitor-1" });

    await analytics.track("generation_started", { scope: "run-1", mode: "fixture" });
    await analytics.track("generation_started", { scope: "run-1", mode: "fixture" });

    expect(sink).toHaveBeenCalledTimes(1);
    expect(sink).toHaveBeenCalledWith({
      event: "generation_started",
      visitorId: "visitor-1",
      properties: { scope: "run-1", mode: "fixture" },
    });
  });
});
