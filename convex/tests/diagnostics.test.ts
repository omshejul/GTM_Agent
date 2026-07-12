import { describe, expect, it } from "vitest";
import { safeValidationMessage } from "../ai";
import { generationInputDiagnostics } from "../generations";

describe("generation diagnostics", () => {
  it("records useful shape and correlation data without input values", () => {
    const details = generationInputDiagnostics({
      sellerSolution: "Warehouse Management System",
      targetIndustry: "Retail",
      targetRegion: "Pan India",
      companyName: "Private Company",
      sourceText: "Private source material",
      sourceUrl: "https://private.example/news",
      researchWithLinkUp: true,
      idempotencyKey: "trace-123",
    });

    expect(details).toEqual({
      traceId: "trace-123",
      hasCompanyName: true,
      hasSourceText: true,
      hasSourceUrl: true,
      researchEnabled: true,
      sourceTextLength: 23,
    });
    expect(JSON.stringify(details)).not.toContain("Private Company");
    expect(JSON.stringify(details)).not.toContain("private.example");
    expect(JSON.stringify(details)).not.toContain("Private source material");
  });
});

it("redacts URLs from AI validation logs", () => {
  expect(
    safeValidationMessage(
      new Error("Citation was not supplied: https://private.example/news"),
    ),
  ).toBe("Citation was not supplied: [redacted-url]");
});
