import { httpRouter, makeFunctionReference } from "convex/server";
import { httpActionGeneric } from "convex/server";
import { parseDodoSubscriptionEvent, verifyDodoWebhook } from "./payments";

const processWebhookRef = makeFunctionReference<
  "mutation",
  {
    providerEventId: string;
    eventType: string;
    ownerSubject?: string;
    customerId?: string;
    subscriptionId?: string;
    productId?: string;
    status: string;
    entitled: boolean;
    providerEventAt: number;
  },
  { duplicate: boolean; stale?: boolean }
>("payments:processWebhook");

const dodoWebhook = httpActionGeneric(async (ctx, request) => {
  const secret = process.env.DODO_WEBHOOK_SECRET;
  if (!secret) return new Response("Payments are not enabled", { status: 503 });
  const body = await request.text();
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  if (
    !id ||
    !(await verifyDodoWebhook(body, { id, timestamp, signature }, secret))
  ) {
    return new Response("Invalid signature", { status: 401 });
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const subscriptionEvent = parseDodoSubscriptionEvent(payload);
  if (!subscriptionEvent) return new Response("Event ignored", { status: 202 });
  try {
    const result = await ctx.runMutation(processWebhookRef, {
      providerEventId: id,
      ...subscriptionEvent,
    });
    return Response.json(result, { status: 200 });
  } catch (error) {
    console.error(
      "Dodo webhook processing failed",
      error instanceof Error ? error.message : error,
    );
    return new Response("Webhook processing failed", { status: 500 });
  }
});

const http = httpRouter();
http.route({ path: "/webhooks/dodo", method: "POST", handler: dodoWebhook });

export default http;
