import { describe, expect, it } from "vitest";
import { friendlyAgentError, getAgentErrorCode } from "./errors";

describe("friendlyAgentError", () => {
  it.each([
    ["INVALID_INPUT", "Check the account and source inputs"],
    ["RESEARCH_FAILED", "Paste source text or retry without company research"],
    ["AI_FAILED", "AI provider could not complete the analysis"],
    ["INVALID_AI_OUTPUT", "response could not be validated"],
  ] as const)("maps %s to an actionable message", (code, expected) => {
    expect(friendlyAgentError({ code })).toContain(expected);
  });

  it("does not expose unknown backend error details", () => {
    expect(friendlyAgentError(new Error("secret upstream payload"))).toBe(
      "We could not complete the analysis. Your inputs are still here, so you can retry.",
    );
  });

  it("reads structured codes from ConvexError data", () => {
    const error = Object.assign(new Error("Server Error"), {
      name: "ConvexError",
      data: {
        code: "INVALID_AI_OUTPUT",
        message: "The AI provider returned invalid structured output",
        recoverable: true,
      },
    });

    expect(getAgentErrorCode(error)).toBe("INVALID_AI_OUTPUT");
    expect(friendlyAgentError(error)).toContain(
      "response could not be validated",
    );
  });
});
