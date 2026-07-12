// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { ShareDialog } from "./share-dialog";
import type { ProductClient } from "../lib/product-client";

const client: ProductClient = {
  mode: "fixture",
  generateOpportunity: vi.fn(),
  createShare: vi.fn(async () => ({ token: "demo-fixture-strong" })),
  startCheckout: vi.fn(),
  getEntitlement: vi.fn(async () => ({ paid: false })),
  trackEvent: vi.fn(async () => undefined),
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ShareDialog", () => {
  it("requests a server-owned token boundary and exposes a read-only URL", async () => {
    render(<ShareDialog result={strongOpportunityFixture} client={client} />);
    fireEvent.click(screen.getByRole("button", { name: "Share result" }));
    fireEvent.click(screen.getByRole("button", { name: "Create read-only link" }));

    expect(await screen.findByDisplayValue(/\/share\/demo-fixture-strong$/)).not.toBeNull();
    expect(client.createShare).toHaveBeenCalledWith(strongOpportunityFixture.id);
    expect(client.trackEvent).toHaveBeenCalledWith(
      "share_created",
      expect.objectContaining({ resultId: strongOpportunityFixture.id }),
    );
  });
});
