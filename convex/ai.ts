import {
  parseExtractedOpportunity,
  signals,
  type AgentErrorCode,
  type ExtractedOpportunity,
  type GenerateOpportunityInput,
} from "@ai-gtm/contracts";
import type { ResearchSource } from "./research";

export class AgentServiceError extends Error {
  constructor(
    readonly code: AgentErrorCode,
    message: string,
    readonly recoverable: boolean,
  ) {
    super(message);
  }
}

const SYSTEM_PROMPT = `You are an evidence-grounded India-first warehouse expansion analyst. Return only JSON.
Unknown company, industry, location, event, and date facts must be null. Every signal and factual claim must be directly supported by a verbatim excerpt from supplied source text or a numbered research source. Funding alone is not evidence of warehouse expansion. Preserve uncertainty and contradictions; never treat missing evidence as evidence of absence. Never fabricate urgency, a buying process, a person, or contact details. Outreach is a draft for human review and is never sent automatically. The backend will deterministically replace solution, buyer, and next-action recommendations.
Allowed signals: ${signals.join(", ")}.
Required keys: companyName, industry, eventType, location, eventDate, signals, evidence, citations, recommendedSolution, reasoning, recommendedContactRole, nextAction, linkedinMessage, emailOpener, confidence.
Evidence entries contain text, signal, and citationIndex (zero-based or null for pasted text). Citations contain url, title, publishedAt. confidence is 0 through 1.`;

const jsonSchema = {
  name: "warehouse_expansion_opportunity",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "companyName",
      "industry",
      "eventType",
      "location",
      "eventDate",
      "signals",
      "evidence",
      "citations",
      "recommendedSolution",
      "reasoning",
      "recommendedContactRole",
      "nextAction",
      "linkedinMessage",
      "emailOpener",
      "confidence",
    ],
    properties: {
      companyName: { type: ["string", "null"] },
      industry: { type: ["string", "null"] },
      eventType: { type: ["string", "null"] },
      location: { type: ["string", "null"] },
      eventDate: { type: ["string", "null"] },
      signals: {
        type: "array",
        items: { type: "string", enum: signals },
      },
      evidence: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["text", "signal", "citationIndex"],
          properties: {
            text: { type: "string" },
            signal: { type: "string", enum: signals },
            citationIndex: { type: ["integer", "null"], minimum: 0 },
          },
        },
      },
      citations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["url", "title", "publishedAt"],
          properties: {
            url: { type: "string" },
            title: { type: "string" },
            publishedAt: { type: ["string", "null"] },
          },
        },
      },
      recommendedSolution: { type: "string" },
      reasoning: { type: "string" },
      recommendedContactRole: { type: "string" },
      nextAction: { type: "string" },
      linkedinMessage: { type: "string" },
      emailOpener: { type: "string" },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
  },
};

function userPrompt(
  input: GenerateOpportunityInput,
  research: ResearchSource[],
) {
  return JSON.stringify({
    sellerSolution: input.sellerSolution,
    targetIndustry: input.targetIndustry ?? null,
    targetRegion: input.targetRegion ?? null,
    targetState: input.targetState ?? null,
    suppliedCompanyName: input.companyName ?? null,
    sourceText: input.sourceText ?? null,
    sourceUrl: input.sourceUrl ?? null,
    researchSources: research.map((source, citationIndex) => ({
      citationIndex,
      ...source,
    })),
  });
}

function normalizeEvidence(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function supportedFact(
  value: string | null,
  corpus: string,
  explicitlySupplied?: string,
) {
  if (value === null) return null;
  const normalized = normalizeEvidence(value);
  if (
    (explicitlySupplied &&
      normalized === normalizeEvidence(explicitlySupplied)) ||
    corpus.includes(normalized)
  ) {
    return value;
  }
  return null;
}

function validateGrounding(
  extracted: ExtractedOpportunity,
  input: GenerateOpportunityInput,
  research: ResearchSource[],
): ExtractedOpportunity {
  const researchByUrl = new Map(research.map((source) => [source.url, source]));
  const citations = extracted.citations.map((citation) => {
    const source = researchByUrl.get(citation.url);
    if (!source)
      throw new Error(`Citation was not supplied by research: ${citation.url}`);
    return {
      url: source.url,
      title: source.title,
      publishedAt: source.publishedAt,
    };
  });
  const sourceText = input.sourceText
    ? normalizeEvidence(input.sourceText)
    : null;
  const corpus = [input.sourceText, ...research.map((source) => source.snippet)]
    .filter((value): value is string => Boolean(value))
    .map(normalizeEvidence)
    .join(" ");
  for (const signal of extracted.signals) {
    if (!extracted.evidence.some((evidence) => evidence.signal === signal)) {
      throw new Error(`Signal ${signal} has no supporting evidence`);
    }
  }
  for (const evidence of extracted.evidence) {
    const excerpt = normalizeEvidence(evidence.text);
    if (evidence.citationIndex === null) {
      if (!sourceText || !sourceText.includes(excerpt)) {
        throw new Error(
          "Pasted-text evidence must be a verbatim source excerpt",
        );
      }
      continue;
    }
    const citation = citations[evidence.citationIndex];
    const source = citation ? researchByUrl.get(citation.url) : undefined;
    if (!source || !normalizeEvidence(source.snippet).includes(excerpt)) {
      throw new Error("Researched evidence must be a verbatim source excerpt");
    }
  }
  const companyName = supportedFact(
    extracted.companyName,
    corpus,
    input.companyName,
  );
  const industry = supportedFact(extracted.industry, corpus);
  const eventType = supportedFact(extracted.eventType, corpus);
  const location = supportedFact(extracted.location, corpus);
  const eventDate = supportedFact(extracted.eventDate, corpus);
  const evidenceExcerpt = extracted.evidence[0]?.text;
  const subject = companyName ?? "The company";
  const reasoning = evidenceExcerpt
    ? `The opportunity is based on the supplied evidence: "${evidenceExcerpt}"`
    : "No supported warehouse-expansion signal was detected in the supplied material.";
  const linkedinMessage = evidenceExcerpt
    ? `I noticed ${subject}'s announcement: "${evidenceExcerpt}" Would comparing ${input.sellerSolution} approaches be useful?`
    : `I reviewed ${subject}'s announcement but did not find enough warehouse-expansion evidence for specific outreach.`;
  const emailOpener = evidenceExcerpt
    ? `Your announcement states: "${evidenceExcerpt}" This may be relevant when evaluating ${input.sellerSolution}.`
    : `I reviewed your announcement but would first validate whether a warehouse initiative is planned.`;
  return {
    ...extracted,
    companyName,
    industry,
    eventType,
    location,
    eventDate,
    citations,
    reasoning,
    linkedinMessage,
    emailOpener,
  };
}

export async function extractOpportunity(
  input: GenerateOpportunityInput,
  research: ResearchSource[],
  options: {
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    fetcher?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<ExtractedOpportunity> {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    throw new AgentServiceError(
      "AI_FAILED",
      "The AI provider is not configured",
      true,
    );
  }
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 30_000,
  );
  let repairMessage: string | undefined;
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      let response: Response;
      try {
        response = await fetcher(
          `${(options.baseUrl ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              temperature: 0.1,
              messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt(input, research) },
                ...(repairMessage
                  ? [{ role: "user", content: repairMessage }]
                  : []),
              ],
              response_format: { type: "json_schema", json_schema: jsonSchema },
            }),
            signal: controller.signal,
          },
        );
      } catch (error) {
        throw new AgentServiceError(
          "AI_FAILED",
          error instanceof DOMException && error.name === "AbortError"
            ? "The AI provider timed out"
            : "The AI provider could not be reached",
          true,
        );
      }
      if (!response.ok) {
        throw new AgentServiceError(
          "AI_FAILED",
          `The AI provider returned status ${response.status}`,
          response.status >= 500 || response.status === 429,
        );
      }
      try {
        const payload = (await response.json()) as {
          choices?: Array<{ message?: { content?: string | null } }>;
        };
        const content = payload.choices?.[0]?.message?.content;
        if (!content) throw new Error("Missing model content");
        return validateGrounding(
          parseExtractedOpportunity(JSON.parse(content)),
          input,
          research,
        );
      } catch (error) {
        repairMessage = `Your previous response was invalid: ${error instanceof Error ? error.message : "invalid JSON"}. Return one corrected JSON object only.`;
      }
    }
    throw new AgentServiceError(
      "INVALID_AI_OUTPUT",
      "The AI provider returned invalid structured output",
      true,
    );
  } finally {
    clearTimeout(timeout);
  }
}
