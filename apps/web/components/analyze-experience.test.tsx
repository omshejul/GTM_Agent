// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { AnalyzeExperience } from "./analyze-experience";
import type { ProductClient } from "../lib/product-client";

function client(overrides: Partial<ProductClient> = {}): ProductClient {
  return {
    mode: "fixture",
    generateOpportunity: vi.fn(async () => strongOpportunityFixture),
    createShare: vi.fn(async () => ({ token: "demo-fixture-strong" })),
    startCheckout: vi.fn(async () => ({ url: "https://checkout.example" })),
    getEntitlement: vi.fn(async () => ({ paid: false })),
    trackEvent: vi.fn(async () => undefined),
    ...overrides,
  };
}

afterEach(() => cleanup());

describe("AnalyzeExperience", () => {
  it("loads a sample, invokes the action boundary, and renders its typed result", async () => {
    const productClient = client();
    render(<AnalyzeExperience client={productClient} />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze opportunity" }));

    expect(await screen.findByText("Analysis complete")).not.toBeNull();
    expect(productClient.generateOpportunity).toHaveBeenCalledTimes(1);
    expect(productClient.trackEvent).toHaveBeenCalledWith(
      "generation_completed",
      expect.objectContaining({ resultId: strongOpportunityFixture.id }),
    );
    expect(JSON.stringify(vi.mocked(productClient.trackEvent).mock.calls)).not.toContain("Example Retail Ltd");
  });

  it("keeps generation successful when analytics is unavailable", async () => {
    const productClient = client({
      trackEvent: vi.fn(async () => Promise.reject(new Error("analytics offline"))),
    });
    render(<AnalyzeExperience client={productClient} />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze opportunity" }));

    expect(await screen.findByText("Analysis complete")).not.toBeNull();
    expect(productClient.generateOpportunity).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Analyze opportunity" }).hasAttribute("disabled")).toBe(false);
  });

  it("discloses that fixture results do not analyze custom input", () => {
    render(<AnalyzeExperience client={client()} />);
    expect(screen.getByText(/typed sample result and does not analyze custom input/i)).not.toBeNull();
  });

  it("preserves inputs and maps recoverable backend errors", async () => {
    const productClient = client({
      generateOpportunity: vi.fn(async () => Promise.reject({ code: "RESEARCH_FAILED" })),
    });
    render(<AnalyzeExperience client={productClient} />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze opportunity" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Paste source text or retry without company research",
    );
    expect((screen.getByLabelText("Seller solution") as HTMLInputElement).value).toContain(
      "Warehouse management",
    );
    await waitFor(() => expect(productClient.trackEvent).toHaveBeenCalledWith(
      "generation_failed",
      expect.objectContaining({ code: "RESEARCH_FAILED" }),
    ));
  });
});
