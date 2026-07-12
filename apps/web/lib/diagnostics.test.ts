import { describe, expect, it, vi } from "vitest";
import { diagnosticErrorDetails, logDiagnostic } from "./diagnostics";

describe("logDiagnostic", () => {
  it("logs correlation metadata without sensitive input values", () => {
    const info = vi.fn();

    logDiagnostic(
      "info",
      "generation.started",
      {
        scope: "scope-123",
        mode: "convex",
        hasSourceText: true,
        sourceText: "private source material",
      },
      { info, error: vi.fn(), warn: vi.fn() },
    );

    expect(info).toHaveBeenCalledWith(
      "[AI_GTM] generation.started",
      expect.objectContaining({
        scope: "scope-123",
        mode: "convex",
        hasSourceText: true,
      }),
    );
    expect(JSON.stringify(info.mock.calls)).not.toContain(
      "private source material",
    );
  });
});

describe("diagnosticErrorDetails", () => {
  it("extracts safe Convex correlation details", () => {
    const error = Object.assign(
      new Error(
        "[CONVEX A(opportunities:generateOpportunity)] [Request ID: abc123] Server Error",
      ),
      { data: { code: "INVALID_AI_OUTPUT", recoverable: true } },
    );

    expect(diagnosticErrorDetails(error)).toEqual({
      errorName: "Error",
      errorCode: "INVALID_AI_OUTPUT",
      requestId: "abc123",
      recoverable: true,
    });
  });
});
