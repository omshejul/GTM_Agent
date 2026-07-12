import { describe, expect, it } from "vitest";
import { parseDodoSubscriptionEvent } from "../payments";

describe("parseDodoSubscriptionEvent", () => {
  it("fails closed for unknown events and non-entitled statuses", () => {
    expect(
      parseDodoSubscriptionEvent({ type: "payment.succeeded", data: {} }),
    ).toBeNull();
    expect(
      parseDodoSubscriptionEvent({
        type: "subscription.on_hold",
        created_at: "2026-07-12T10:00:00Z",
        data: {
          id: "sub-1",
          status: "on_hold",
          metadata: { ownerSubject: "user-1" },
        },
      }),
    ).toMatchObject({ entitled: false, status: "on_hold" });
  });

  it("accepts active subscription events with a provider timestamp", () => {
    expect(
      parseDodoSubscriptionEvent({
        type: "subscription.active",
        created_at: "2026-07-12T10:00:00Z",
        data: {
          id: "sub-1",
          status: "active",
          metadata: { ownerSubject: "user-1" },
        },
      }),
    ).toMatchObject({ entitled: true, providerEventAt: 1783850400000 });
  });
});
