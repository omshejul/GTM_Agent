"use client";

import { useMemo, useState } from "react";
import { getProductClient, type ProductClient } from "../lib/product-client";
import { Button } from "./ui/button";

export function isTrustedCheckoutUrl(value: string, expectedHost: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === expectedHost;
  } catch {
    return false;
  }
}

export function PricingExperience({
  client,
  revenueEnabled,
  checkoutHost = "checkout.dodopayments.com",
}: {
  client?: ProductClient;
  revenueEnabled: boolean;
  checkoutHost?: string;
}) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const entitlement = await productClient.getEntitlement();
      if (entitlement.paid) {
        setError("This account already has access to paid features.");
        return;
      }
      const { url } = await productClient.startCheckout();
      if (!isTrustedCheckoutUrl(url, checkoutHost)) {
        throw new Error("Untrusted checkout URL");
      }
      window.location.assign(url);
    } catch {
      setError("Checkout is not configured yet. The free analysis demo is still available.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pricing-grid">
      <article className="panel pricing-card">
        <p className="eyebrow">Demo</p>
        <h2>Evidence-backed analysis</h2>
        <p>Run the fixture scenario, inspect deterministic score inputs, and review draft outreach.</p>
        <strong>Free</strong>
        <a className="button button-secondary" href="/analyze">Use the free demo</a>
      </article>
      <article className="panel pricing-card featured">
        <p className="eyebrow">Revenue track</p>
        <h2>Team intelligence</h2>
        <p>Saved generations, public shares, live research, and team workflows when the backend is connected.</p>
        <strong>Paid plan</strong>
        <Button className="button" type="button" disabled={!revenueEnabled || loading} onClick={checkout}>
          {!revenueEnabled ? "Checkout not configured" : loading ? "Opening checkout…" : "Upgrade with Dodo"}
        </Button>
        <small>Entitlements are always verified by the backend, never by URL parameters or browser state.</small>
        {error ? <div className="alert" role="alert">{error}</div> : null}
      </article>
    </div>
  );
}
