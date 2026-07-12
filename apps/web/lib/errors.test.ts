import { describe, expect, it } from "vitest";
import { friendlyAgentError } from "./errors";

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
});
