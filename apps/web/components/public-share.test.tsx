// @vitest-environment jsdom

import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { PublicShare } from "./public-share";
import type { ProductClient } from "../lib/product-client";

const token = "private-bearer-token";

afterEach(() => cleanup());

describe("PublicShare", () => {
  it("absorbs public-view analytics failures", async () => {
    const trackEvent = vi.fn(async () => Promise.reject(new Error("analytics offline")));
    const client: ProductClient = {
      mode: "fixture",
      generateOpportunity: vi.fn(),
      createShare: vi.fn(),
      startCheckout: vi.fn(),
      getEntitlement: vi.fn(async () => ({ paid: false })),
      trackEvent,
    };

    render(<PublicShare result={strongOpportunityFixture} client={client} />);
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));
    expect(document.body.textContent).toContain("Example Retail Ltd");
  });

  it("tracks a public view without logging its bearer token", async () => {
    const trackEvent = vi.fn(async () => undefined);
    const client: ProductClient = {
      mode: "fixture",
      generateOpportunity: vi.fn(),
      createShare: vi.fn(),
      startCheckout: vi.fn(),
      getEntitlement: vi.fn(async () => ({ paid: false })),
      trackEvent,
    };

    render(<PublicShare result={strongOpportunityFixture} client={client} />);
    await waitFor(() => expect(trackEvent).toHaveBeenCalledTimes(1));

    expect(trackEvent).toHaveBeenCalledWith("share_viewed", {
      scope: strongOpportunityFixture.id,
      resultId: strongOpportunityFixture.id,
    });
    expect(JSON.stringify(trackEvent.mock.calls)).not.toContain(token);
    expect(document.body.textContent).not.toContain("Draft only");
  });
});
