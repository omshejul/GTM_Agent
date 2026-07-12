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
    fireEvent.click(
      screen.getByRole("button", { name: "Analyze opportunity" }),
    );

    expect(onGenerate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain(
      "Add source text, a source URL, or enable company research",
    );
    expect(
      (screen.getByLabelText("Seller solution") as HTMLInputElement).value,
    ).toBe("Warehouse automation");
  });

  it("submits user-provided contract input", () => {
    const onGenerate = vi.fn();
    render(<AnalysisForm onGenerate={onGenerate} />);

    fireEvent.change(screen.getByLabelText("Seller solution"), {
      target: { value: "Warehouse Management System" },
    });
    fireEvent.change(screen.getByLabelText("Company name"), {
      target: { value: "Acme Retail" },
    });
    fireEvent.change(screen.getByLabelText("Source text"), {
      target: { value: "Acme Retail announced a warehouse in Bengaluru." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Analyze opportunity" }),
    );

    expect(onGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        sellerSolution: "Warehouse Management System",
        companyName: "Acme Retail",
        researchWithLinkUp: false,
      }),
    );
  });
});

describe("OpportunityDashboard", () => {
  it("renders explainable score evidence and human-review messaging", () => {
    render(<OpportunityDashboard result={strongOpportunityFixture} />);

    expect(screen.getByText("70")).not.toBeNull();
    expect(screen.getByText("Score breakdown")).not.toBeNull();
    expect(
      screen.getAllByText(/announced a new fulfilment centre/i),
    ).not.toHaveLength(0);
    expect(
      screen.getByText(/review and approve before sending/i),
    ).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "Open saved result" }).getAttribute("href"),
    ).toBe(`/results/${strongOpportunityFixture.id}`);
  });
});
