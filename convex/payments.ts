import {
  actionGeneric,
  internalMutationGeneric,
  queryGeneric,
} from "convex/server";
import { v } from "convex/values";

interface WebhookHeaders {
  id: string;
  timestamp: string;
  signature?: string;
}

function decodeSecret(secret: string): Uint8Array {
  const value = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
  } catch {
    return new TextEncoder().encode(value);
  }
}

export async function signWebhookPayload(
  body: string,
  headers: Pick<WebhookHeaders, "id" | "timestamp">,
  secret: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    decodeSecret(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${headers.id}.${headers.timestamp}.${body}`),
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function constantTimeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

export async function verifyDodoWebhook(
  body: string,
  headers: WebhookHeaders,
  secret: string,
  options: { nowSeconds?: number; toleranceSeconds?: number } = {},
): Promise<boolean> {
  const timestamp = Number(headers.timestamp);
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1_000);
  if (
    !Number.isFinite(timestamp) ||
    Math.abs(now - timestamp) > (options.toleranceSeconds ?? 300)
  ) {
    return false;
  }
  const expected = await signWebhookPayload(body, headers, secret);
  return (headers.signature ?? "")
    .split(" ")
    .some(
      (candidate) =>
        candidate.startsWith("v1,") &&
        constantTimeEqual(candidate.slice(3), expected),
    );
}

export interface DodoSubscriptionEvent {
  eventType: string;
  ownerSubject?: string;
  customerId?: string;
  subscriptionId?: string;
  productId?: string;
  status: string;
  entitled: boolean;
  providerEventAt: number;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string => typeof value === "string" && value.length > 0,
  );
}

export function parseDodoSubscriptionEvent(
  payload: unknown,
): DodoSubscriptionEvent | null {
  const event = record(payload);
  const eventType = stringValue(event.type, event.event_type);
  const supportedEvents = new Set([
    "subscription.active",
    "subscription.renewed",
    "subscription.updated",
    "subscription.on_hold",
    "subscription.cancelled",
    "subscription.expired",
    "subscription.failed",
  ]);
  if (!eventType || !supportedEvents.has(eventType)) return null;
  const data = record(event.data);
  const metadata = record(data.metadata);
  const status = stringValue(data.status, eventType.split(".").at(-1));
  const providerEventAt = Date.parse(
    stringValue(event.created_at, event.createdAt) ?? "",
  );
  if (!status || !Number.isFinite(providerEventAt)) return null;
  return {
    eventType,
    ownerSubject: stringValue(metadata.ownerSubject, metadata.owner_subject),
    customerId: stringValue(data.customer_id, data.customerId),
    subscriptionId: stringValue(
      data.subscription_id,
      data.subscriptionId,
      data.id,
    ),
    productId: stringValue(data.product_id, data.productId),
    status,
    entitled: status === "active" || status === "trialing",
    providerEventAt,
  };
}

export const createCheckout = actionGeneric({
  args: { productId: v.string(), returnUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Authentication is required");
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    if (!apiKey) throw new Error("Payments are not enabled");
    const allowedProducts = (process.env.DODO_PRODUCT_IDS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!allowedProducts.length || !allowedProducts.includes(args.productId)) {
      throw new Error("Product is not available");
    }
    const returnUrl = new URL(args.returnUrl);
    const appOrigin = process.env.APP_ORIGIN;
    if (!appOrigin || returnUrl.origin !== new URL(appOrigin).origin)
      throw new Error("Return URL must use the configured application origin");
    const response = await fetch("https://live.dodopayments.com/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_cart: [{ product_id: args.productId, quantity: 1 }],
        return_url: returnUrl.toString(),
        metadata: { ownerSubject: identity.subject },
      }),
    });
    if (!response.ok)
      throw new Error(`Checkout creation failed (${response.status})`);
    const payload = (await response.json()) as {
      checkout_url?: string;
      checkout_id?: string;
    };
    if (!payload.checkout_url)
      throw new Error("Payment provider returned no checkout URL");
    return {
      checkoutUrl: payload.checkout_url,
      checkoutId: payload.checkout_id ?? null,
    };
  },
});

export const getEntitlement = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity)
      return { tier: "free" as const, entitled: false, status: "anonymous" };
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_owner", (q) => q.eq("ownerSubject", identity.subject))
      .unique();
    return subscription
      ? {
          tier: subscription.entitled ? ("paid" as const) : ("free" as const),
          entitled: subscription.entitled,
          status: subscription.status,
        }
      : { tier: "free" as const, entitled: false, status: "none" };
  },
});

export const processWebhook = internalMutationGeneric({
  args: {
    providerEventId: v.string(),
    eventType: v.string(),
    ownerSubject: v.optional(v.string()),
    customerId: v.optional(v.string()),
    subscriptionId: v.optional(v.string()),
    productId: v.optional(v.string()),
    status: v.string(),
    entitled: v.boolean(),
    providerEventAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existingEvent = await ctx.db
      .query("webhookEvents")
      .withIndex("by_provider_event", (q) =>
        q.eq("providerEventId", args.providerEventId),
      )
      .unique();
    if (existingEvent?.status === "processed") return { duplicate: true };
    const now = Date.now();
    const eventId =
      existingEvent?._id ??
      (await ctx.db.insert("webhookEvents", {
        provider: "dodo" as const,
        providerEventId: args.providerEventId,
        eventType: args.eventType,
        status: "processing" as const,
        receivedAt: now,
      }));
    if (args.ownerSubject) {
      const existingSubscription = await ctx.db
        .query("subscriptions")
        .withIndex("by_owner", (q) => q.eq("ownerSubject", args.ownerSubject!))
        .unique();
      const value = {
        ownerSubject: args.ownerSubject,
        dodoCustomerId: args.customerId,
        dodoSubscriptionId: args.subscriptionId,
        dodoProductId: args.productId,
        status: args.status,
        entitled: args.entitled,
        lastProviderEventAt: args.providerEventAt,
        updatedAt: now,
      };
      if (
        existingSubscription &&
        existingSubscription.lastProviderEventAt >= args.providerEventAt
      ) {
        await ctx.db.patch(eventId, {
          status: "processed",
          processedAt: now,
        });
        return { duplicate: false, stale: true };
      }
      if (existingSubscription)
        await ctx.db.patch(existingSubscription._id, value);
      else await ctx.db.insert("subscriptions", value);
    }
    await ctx.db.patch(eventId, { status: "processed", processedAt: now });
    return { duplicate: false, stale: false };
  },
});
