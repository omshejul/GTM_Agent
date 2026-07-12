import { describe, expect, it } from "vitest";
import {
  parseDodoSubscriptionEvent,
  signWebhookPayload,
  verifyDodoWebhook,
} from "../payments";

describe("verifyDodoWebhook", () => {
  it("accepts a valid standard-webhooks signature and rejects replayed content", async () => {
    const body = JSON.stringify({ type: "subscription.active" });
    const headers = { id: "evt_1", timestamp: "1700000000" };
    const signature = await signWebhookPayload(
      body,
      headers,
      "whsec_dGVzdC1zZWNyZXQ=",
    );
    await expect(
      verifyDodoWebhook(
        body,
        { ...headers, signature: `v1,${signature}` },
        "whsec_dGVzdC1zZWNyZXQ=",
        {
          nowSeconds: 1700000000,
        },
      ),
    ).resolves.toBe(true);
    await expect(
      verifyDodoWebhook(
        `${body} `,
        { ...headers, signature: `v1,${signature}` },
        "whsec_dGVzdC1zZWNyZXQ=",
        {
          nowSeconds: 1700000000,
        },
      ),
    ).resolves.toBe(false);
  });

  it("rejects stale webhook timestamps", async () => {
    await expect(
      verifyDodoWebhook(
        "{}",
        { id: "evt", timestamp: "1", signature: "v1,bad" },
        "secret",
        {
          nowSeconds: 1000,
        },
      ),
    ).resolves.toBe(false);
  });
});
