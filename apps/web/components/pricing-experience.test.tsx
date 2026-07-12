// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PricingExperience } from "./pricing-experience";
import type { ProductClient } from "../lib/product-client";

const client: ProductClient = {
  mode: "fixture",
  generateOpportunity: vi.fn(),
  createShare: vi.fn(),
  startCheckout: vi.fn(),
  getEntitlement: vi.fn(async () => ({ paid: false })),
  trackEvent: vi.fn(async () => undefined),
};

afterEach(() => cleanup());

describe("PricingExperience", () => {
  it("keeps analysis usable while revenue checkout is feature-gated", () => {
    render(<PricingExperience client={client} revenueEnabled={false} />);
    expect(screen.getByRole("link", { name: "Use the free demo" }).getAttribute("href")).toBe("/analyze");
    expect((screen.getByRole("button", { name: "Checkout not configured" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Entitlements are always verified by the backend/i)).not.toBeNull();
  });
});
