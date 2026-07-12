// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  generateDeterministicLeadRoast,
  strongOpportunityFixture,
} from "@ai-gtm/contracts";
import { ResultActions } from "./result-actions";
import type { ProductClient } from "../lib/product-client";

afterEach(() => cleanup());

const client = {
  mode: "fixture",
  generateLeadRoast: vi.fn(async (_id, tone) =>
    generateDeterministicLeadRoast(strongOpportunityFixture, tone),
  ),
} as unknown as ProductClient;

describe("ResultActions", () => {
  it("generates an evidence-grounded roast in the selected tone", async () => {
    render(<ResultActions result={strongOpportunityFixture} client={client} />);
    fireEvent.change(screen.getByLabelText("Lead roast tone"), {
      target: { value: "sales_team_spicy" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate roast" }));
    expect(await screen.findByLabelText("Generated lead roast")).not.toBeNull();
    expect(client.generateLeadRoast).toHaveBeenCalledWith(
      strongOpportunityFixture.id,
      "sales_team_spicy",
    );
  });

  it("offers JSON export", () => {
    render(<ResultActions result={strongOpportunityFixture} client={client} />);
    expect(
      screen.getByRole("button", { name: "Download JSON" }),
    ).not.toBeNull();
  });
});
