import { PricingExperience } from "../../components/pricing-experience";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const revenueEnabled = process.env.NEXT_PUBLIC_REVENUE_ENABLED === "true";
  const checkoutHost = process.env.NEXT_PUBLIC_DODO_CHECKOUT_HOST ?? "checkout.dodopayments.com";
  const { checkout } = await searchParams;

  return (
    <main className="product-shell">
      <header className="page-header">
        <a className="brand" href="/">AI GTM OS</a>
        <a href="/analyze">Analyze</a>
      </header>
      <section className="analyze-hero compact-hero">
        <p className="eyebrow">Simple plans</p>
        <h1>Start with the signal. Upgrade for the workflow.</h1>
        <p>The core fixture demo remains available even when payments and live research are not configured.</p>
      </section>
      {checkout === "success" ? (
        <div className="checkout-state" role="status">
          Checkout completed. Paid access will appear after the backend verifies your entitlement.
        </div>
      ) : checkout === "cancelled" ? (
        <div className="checkout-state checkout-cancelled" role="status">
          Checkout was cancelled. No access changes were made.
        </div>
      ) : null}
      <PricingExperience revenueEnabled={revenueEnabled} checkoutHost={checkoutHost} />
    </main>
  );
}
