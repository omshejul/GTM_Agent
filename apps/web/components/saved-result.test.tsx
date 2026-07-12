// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { SavedResult } from "./saved-result";
import type { ProductClient } from "../lib/product-client";

const client = {
  mode: "convex",
  getGeneration: vi.fn(async () => strongOpportunityFixture),
} as unknown as ProductClient;

afterEach(() => cleanup());

it("loads a persisted generation by id", async () => {
  render(<SavedResult id="generation-1" client={client} />);

  expect(await screen.findByText("Analysis complete")).not.toBeNull();
  expect(client.getGeneration).toHaveBeenCalledWith("generation-1");
});
