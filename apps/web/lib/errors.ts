import type { AgentErrorCode } from "@ai-gtm/contracts";

const messages: Record<AgentErrorCode, string> = {
  INVALID_INPUT: "Check the account and source inputs, then try again.",
  RESEARCH_FAILED: "Company research failed. Paste source text or retry without company research.",
  AI_FAILED: "The AI provider could not complete the analysis. Wait a moment and retry.",
  INVALID_AI_OUTPUT: "The provider response could not be validated. Retry or use a more specific source.",
};

export function getAgentErrorCode(error: unknown): AgentErrorCode | null {
  if (!error || typeof error !== "object" || !("code" in error)) return null;
  const code = String(error.code);
  return code in messages ? (code as AgentErrorCode) : null;
}

export function friendlyAgentError(error: unknown): string {
  const code = getAgentErrorCode(error);
  return code
    ? messages[code]
    : "We could not complete the analysis. Your inputs are still here, so you can retry.";
}
