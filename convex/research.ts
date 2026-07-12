import type { Citation, GenerateOpportunityInput } from "@ai-gtm/contracts";
import { AgentServiceError } from "./ai";

export interface ResearchSource extends Citation {
  snippet: string;
}

interface LinkUpResult {
  url?: unknown;
  name?: unknown;
  title?: unknown;
  content?: unknown;
  snippet?: unknown;
  publishedAt?: unknown;
  date?: unknown;
}

export async function researchCompany(
  input: GenerateOpportunityInput,
  options: { apiKey?: string; fetcher?: typeof fetch; timeoutMs?: number } = {},
): Promise<ResearchSource[]> {
  if (!input.researchWithLinkUp || (!input.companyName && !input.sourceUrl))
    return [];
  const apiKey = options.apiKey ?? process.env.LINKUP_API_KEY;
  if (!apiKey) {
    throw new AgentServiceError(
      "RESEARCH_FAILED",
      "LinkUp research is not configured",
      true,
    );
  }
  const query = [
    input.companyName ?? input.sourceUrl,
    input.targetRegion,
    input.targetState,
    "warehouse fulfilment center lease automation supply chain expansion hiring funding",
  ]
    .filter(Boolean)
    .join(" ");
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 12_000,
  );
  try {
    const response = await (options.fetcher ?? fetch)(
      "https://api.linkup.so/v1/search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
          depth: "standard",
          outputType: "searchResults",
        }),
        signal: controller.signal,
      },
    );
    if (!response.ok) {
      throw new AgentServiceError(
        "RESEARCH_FAILED",
        `LinkUp request failed with status ${response.status}`,
        true,
      );
    }
    const payload = (await response.json()) as { results?: LinkUpResult[] };
    return (payload.results ?? [])
      .map((result): ResearchSource | null => {
        const url = typeof result.url === "string" ? result.url : "";
        const title =
          typeof result.name === "string"
            ? result.name
            : typeof result.title === "string"
              ? result.title
              : "Untitled source";
        const rawSnippet =
          typeof result.content === "string"
            ? result.content
            : typeof result.snippet === "string"
              ? result.snippet
              : "";
        if (!url || !rawSnippet) return null;
        return {
          url,
          title: title.slice(0, 500),
          publishedAt:
            typeof result.publishedAt === "string"
              ? result.publishedAt
              : typeof result.date === "string"
                ? result.date
                : null,
          snippet: rawSnippet.trim().replace(/\s+/g, " ").slice(0, 1_500),
        };
      })
      .filter((source): source is ResearchSource => source !== null)
      .slice(0, 10);
  } catch (error) {
    if (error instanceof AgentServiceError) throw error;
    throw new AgentServiceError(
      "RESEARCH_FAILED",
      error instanceof DOMException && error.name === "AbortError"
        ? "LinkUp research timed out"
        : "LinkUp research could not be completed",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}
