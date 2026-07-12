// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { AnalysisForm } from "./analysis-form";
import { OpportunityDashboard } from "./opportunity-dashboard";

afterEach(() => cleanup());

describe("AnalysisForm", () => {
  it("preserves the form and explains valid source requirements", () => {
    const onGenerate = vi.fn();
    render(<AnalysisForm onGenerate={onGenerate} />);

    fireEvent.change(screen.getByLabelText("Seller solution"), {
      target: { value: "Warehouse automation" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Analyze opportunity" }));

    expect(onGenerate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Add source text, a source URL, or enable company research",
    );
    expect((screen.getByLabelText("Seller solution") as HTMLInputElement).value).toBe(
      "Warehouse automation",
    );
  });

  it("loads a demo scenario and submits the shared contract input", () => {
    const onGenerate = vi.fn();
    render(<AnalysisForm onGenerate={onGenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Load sample scenario" }));
    fireEvent.click(screen.getByRole("button", { name: "Analyze opportunity" }));

    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerSolution: "Warehouse management and inventory visibility",
        companyName: "Example Retail Ltd",
        researchWithLinkUp: false,
      }),
    );
  });
});

describe("OpportunityDashboard", () => {
  it("renders explainable score evidence and human-review messaging", () => {
    render(<OpportunityDashboard result={strongOpportunityFixture} />);

    expect(screen.getByText("55")).not.toBeNull();
    expect(screen.getByText("Score breakdown")).not.toBeNull();
    expect(screen.getByText(/announced a new fulfilment centre/i)).not.toBeNull();
    expect(screen.getByText(/review and approve before sending/i)).not.toBeNull();
  });
});
