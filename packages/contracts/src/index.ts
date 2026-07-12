export { demoOpportunityFixtures } from "./fixtures";
export type { DemoOpportunityFixture } from "./fixtures";
export {
  generateDeterministicLeadRoast,
  leadRoastTones,
  LeadRoastError,
  moderateLeadRoast,
} from "./roast";
export type { LeadRoast, LeadRoastTone } from "./roast";

export const signals = [
  "new_warehouse",
  "new_fulfilment_centre",
  "warehouse_hiring",
  "regional_expansion",
  "automation_investment",
  "funding_announcement",
  "inventory_pressure",
  "third_party_logistics_expansion",
] as const;

export type Signal = (typeof signals)[number];
export type IntentBand = "high_priority" | "medium_priority" | "low_priority";
export const sellerSolutions = [
  "Warehouse Management System",
  "Warehouse Automation",
  "Robotics",
  "Inventory Software",
  "Material Handling",
  "3PL Services",
  "Custom",
] as const;
export const targetIndustries = [
  "Retail",
  "Ecommerce",
  "Manufacturing",
  "Logistics",
  "FMCG",
] as const;
export const indiaStatesAndRegions = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Maharashtra",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Delhi NCR",
  "Gujarat",
  "North India",
  "South India",
  "East India",
  "West India",
  "Central India",
  "Northeast India",
  "Pan India",
] as const;
export type AgentErrorCode =
  "INVALID_INPUT" | "RESEARCH_FAILED" | "AI_FAILED" | "INVALID_AI_OUTPUT";

export const analyticsEventNames = [
  "visitor_started",
  "signup_completed",
  "generation_started",
  "generation_completed",
  "generation_failed",
  "share_created",
  "share_viewed",
  "lead_roast_generated",
  "lead_roast_shared",
] as const;
export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export interface GenerateOpportunityInput {
  sellerSolution: string;
  targetIndustry?: string;
  targetRegion?: string;
  targetState?: string;
  sourceText?: string;
  sourceUrl?: string;
  companyName?: string;
  researchWithLinkUp: boolean;
  visitorId?: string;
  idempotencyKey?: string;
}

export interface Citation {
  url: string;
  title: string;
  publishedAt: string | null;
}
export interface Evidence {
  text: string;
  signal: Signal;
  citationIndex: number | null;
}
export interface ScoreLine {
  signal: Signal;
  points: number;
}

export interface ExtractedOpportunity {
  companyName: string | null;
  industry: string | null;
  eventType: string | null;
  location: string | null;
  eventDate: string | null;
  signals: Signal[];
  evidence: Evidence[];
  citations: Citation[];
  recommendedSolution: string;
  reasoning: string;
  recommendedContactRole: string;
  nextAction: string;
  linkedinMessage: string;
  emailOpener: string;
  confidence: number;
}

export interface AgentResult extends ExtractedOpportunity {
  id: string;
  scoreBreakdown: ScoreLine[];
  intentScore: number;
  intentBand: IntentBand;
}

export interface AgentFailure {
  code: AgentErrorCode;
  message: string;
  recoverable: boolean;
}

export class AgentContractError extends Error {
  readonly code = "INVALID_INPUT" as const;
}

const signalSet = new Set<string>(signals);
const intentBands = new Set<string>([
  "high_priority",
  "medium_priority",
  "low_priority",
]);

function object(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new AgentContractError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(
  value: unknown,
  name: string,
  options: { nullable?: boolean; required?: boolean; max?: number } = {},
): string | null | undefined {
  if (value === null && options.nullable) return null;
  if (value === undefined && !options.required) return undefined;
  if (typeof value !== "string")
    throw new AgentContractError(`${name} must be a string`);
  const result = value.trim();
  if (!result && options.required)
    throw new AgentContractError(`${name} is required`);
  if (options.max && result.length > options.max) {
    throw new AgentContractError(
      `${name} must not exceed ${options.max.toLocaleString("en-US")} characters`,
    );
  }
  return result || undefined;
}

export function parseGenerateOpportunityInput(
  value: unknown,
): GenerateOpportunityInput {
  const input = object(value, "input");
  const sellerSolution = text(input.sellerSolution, "sellerSolution", {
    required: true,
    max: 2_000,
  }) as string;
  if (
    !(sellerSolutions as readonly string[]).includes(sellerSolution) &&
    !(
      sellerSolution.startsWith("Custom:") &&
      sellerSolution.slice("Custom:".length).trim().length > 0 &&
      sellerSolution.slice("Custom:".length).trim().length <= 200
    )
  ) {
    throw new AgentContractError("sellerSolution is not supported");
  }
  const sourceText = text(input.sourceText, "sourceText", { max: 50_000 });
  const sourceUrl = text(input.sourceUrl, "sourceUrl", { max: 2_000 });
  const companyName = text(input.companyName, "companyName", { max: 300 });
  if (typeof input.researchWithLinkUp !== "boolean") {
    throw new AgentContractError("researchWithLinkUp must be a boolean");
  }
  if (sourceUrl) {
    let parsed: URL;
    try {
      parsed = new URL(sourceUrl);
    } catch {
      throw new AgentContractError("sourceUrl must be a valid HTTP URL");
    }
    if (!new Set(["http:", "https:"]).has(parsed.protocol)) {
      throw new AgentContractError("sourceUrl must be a valid HTTP URL");
    }
  }
  if (!sourceText && !sourceUrl && !companyName) {
    throw new AgentContractError(
      "At least one sourceText, sourceUrl, or companyName is required",
    );
  }
  if (!sourceText && !input.researchWithLinkUp) {
    throw new AgentContractError(
      "A URL or company name requires LinkUp research",
    );
  }
  const optionalText = (value: unknown, name: string, max: number) =>
    text(value, name, { max }) as string | undefined;
  const targetIndustry = optionalText(
    input.targetIndustry,
    "targetIndustry",
    300,
  );
  if (
    targetIndustry &&
    !(targetIndustries as readonly string[]).includes(targetIndustry)
  ) {
    throw new AgentContractError("targetIndustry is not supported");
  }
  const targetState = optionalText(input.targetState, "targetState", 300);
  if (
    targetState &&
    !(indiaStatesAndRegions as readonly string[]).includes(targetState)
  ) {
    throw new AgentContractError("targetState is not supported");
  }
  const targetRegion = optionalText(input.targetRegion, "targetRegion", 300);
  if (
    targetRegion &&
    !(indiaStatesAndRegions as readonly string[]).includes(targetRegion)
  ) {
    throw new AgentContractError("targetRegion is not supported");
  }
  return {
    sellerSolution,
    targetIndustry,
    targetRegion,
    targetState,
    sourceText: sourceText as string | undefined,
    sourceUrl: sourceUrl as string | undefined,
    companyName: companyName as string | undefined,
    researchWithLinkUp: input.researchWithLinkUp,
    visitorId: optionalText(input.visitorId, "visitorId", 200),
    idempotencyKey: optionalText(input.idempotencyKey, "idempotencyKey", 200),
  };
}

function parseExtracted(value: unknown): ExtractedOpportunity {
  const result = object(value, "result");
  const citationsValue = Array.isArray(result.citations)
    ? result.citations
    : [];
  const citations = citationsValue.map((item, index) => {
    const citation = object(item, `citations[${index}]`);
    const url = text(citation.url, `citations[${index}].url`, {
      required: true,
      max: 2_000,
    }) as string;
    try {
      const parsed = new URL(url);
      if (!new Set(["http:", "https:"]).has(parsed.protocol)) throw new Error();
    } catch {
      throw new AgentContractError(
        `citations[${index}].url must be a valid HTTP URL`,
      );
    }
    return {
      url,
      title: text(citation.title, `citations[${index}].title`, {
        required: true,
        max: 500,
      }) as string,
      publishedAt:
        text(citation.publishedAt, `citations[${index}].publishedAt`, {
          nullable: true,
          max: 100,
        }) ?? null,
    };
  });
  if (
    !Array.isArray(result.signals) ||
    !result.signals.every((signal) => signalSet.has(String(signal)))
  ) {
    throw new AgentContractError("signals contains an unsupported signal");
  }
  const parsedSignals = [...new Set(result.signals as Signal[])];
  if (!Array.isArray(result.evidence))
    throw new AgentContractError("evidence must be an array");
  const evidence = result.evidence.map((item, index) => {
    const entry = object(item, `evidence[${index}]`);
    if (!signalSet.has(String(entry.signal))) {
      throw new AgentContractError(`evidence[${index}].signal is unsupported`);
    }
    if (
      entry.citationIndex !== null &&
      (!Number.isInteger(entry.citationIndex) ||
        (entry.citationIndex as number) < 0 ||
        (entry.citationIndex as number) >= citations.length)
    ) {
      throw new AgentContractError(
        `evidence[${index}].citationIndex is out of range`,
      );
    }
    return {
      text: text(entry.text, `evidence[${index}].text`, {
        required: true,
        max: 2_000,
      }) as string,
      signal: entry.signal as Signal,
      citationIndex: entry.citationIndex as number | null,
    };
  });
  if (
    typeof result.confidence !== "number" ||
    result.confidence < 0 ||
    result.confidence > 1
  ) {
    throw new AgentContractError("confidence must be between 0 and 1");
  }
  const required = (name: keyof ExtractedOpportunity, max = 5_000) =>
    text(result[name], String(name), { required: true, max }) as string;
  const nullable = (name: keyof ExtractedOpportunity) =>
    (text(result[name], String(name), { nullable: true, max: 500 }) ?? null) as
      string | null;
  return {
    companyName: nullable("companyName"),
    industry: nullable("industry"),
    eventType: nullable("eventType"),
    location: nullable("location"),
    eventDate: nullable("eventDate"),
    signals: parsedSignals,
    evidence,
    citations,
    recommendedSolution: required("recommendedSolution"),
    reasoning: required("reasoning"),
    recommendedContactRole: required("recommendedContactRole"),
    nextAction: required("nextAction"),
    linkedinMessage: required("linkedinMessage"),
    emailOpener: required("emailOpener"),
    confidence: result.confidence,
  };
}

export function parseExtractedOpportunity(
  value: unknown,
): ExtractedOpportunity {
  return parseExtracted(value);
}

export function parseAgentResult(value: unknown): AgentResult {
  const result = object(value, "result");
  const extracted = parseExtracted(result);
  if (typeof result.id !== "string" || !result.id)
    throw new AgentContractError("id is required");
  if (
    typeof result.intentScore !== "number" ||
    result.intentScore < 0 ||
    result.intentScore > 100
  ) {
    throw new AgentContractError("intentScore must be between 0 and 100");
  }
  if (!intentBands.has(String(result.intentBand)))
    throw new AgentContractError("intentBand is invalid");
  if (!Array.isArray(result.scoreBreakdown))
    throw new AgentContractError("scoreBreakdown must be an array");
  const scoreBreakdown = result.scoreBreakdown.map((line, index) => {
    const item = object(line, `scoreBreakdown[${index}]`);
    if (
      !signalSet.has(String(item.signal)) ||
      typeof item.points !== "number"
    ) {
      throw new AgentContractError(`scoreBreakdown[${index}] is invalid`);
    }
    return { signal: item.signal as Signal, points: item.points };
  });
  return {
    ...extracted,
    id: result.id,
    scoreBreakdown,
    intentScore: result.intentScore,
    intentBand: result.intentBand as IntentBand,
  };
}

export const scoreWeights: Record<Signal, number> = {
  new_warehouse: 30,
  new_fulfilment_centre: 25,
  warehouse_hiring: 20,
  regional_expansion: 15,
  automation_investment: 10,
  funding_announcement: 10,
  inventory_pressure: 0,
  third_party_logistics_expansion: 0,
};

export function scoreSignals(input: readonly Signal[]) {
  const unique = [...new Set(input)];
  const scoreBreakdown = unique.map((signal) => ({
    signal,
    points: scoreWeights[signal],
  }));
  const intentScore = Math.max(
    0,
    Math.min(
      100,
      scoreBreakdown.reduce((sum, line) => sum + line.points, 0),
    ),
  );
  const intentBand: IntentBand =
    intentScore >= 70
      ? "high_priority"
      : intentScore >= 40
        ? "medium_priority"
        : "low_priority";
  return { scoreBreakdown, intentScore, intentBand };
}

export function recommendForSignals(input: readonly Signal[]) {
  const unique = new Set(input);
  if (unique.has("new_warehouse"))
    return {
      recommendedSolution: "Warehouse Management System",
      recommendedContactRole: "Head of Warehouse Operations",
      nextAction:
        "Validate the warehouse launch timeline and contact the recommended buyer within 30 days.",
    };
  if (unique.has("warehouse_hiring"))
    return {
      recommendedSolution: "Workforce Planning",
      recommendedContactRole: "Head of Warehouse Operations",
      nextAction:
        "Confirm the hiring timeline and contact warehouse operations within 30 days.",
    };
  if (unique.has("automation_investment"))
    return {
      recommendedSolution: "Robotics or Warehouse Automation",
      recommendedContactRole: "Operations Director",
      nextAction:
        "Validate the automation programme scope with the Operations Director.",
    };
  if (unique.has("inventory_pressure"))
    return {
      recommendedSolution: "Inventory Software",
      recommendedContactRole: "Supply Chain Manager",
      nextAction:
        "Validate the inventory-control pressure with the Supply Chain Manager.",
    };
  if (
    unique.has("regional_expansion") ||
    unique.has("third_party_logistics_expansion")
  )
    return {
      recommendedSolution: "3PL Services",
      recommendedContactRole: "Logistics Director",
      nextAction:
        "Validate the regional operating plan with the Logistics Director.",
    };
  return {
    recommendedSolution: "Warehouse Management System",
    recommendedContactRole: "Head of Warehouse Operations",
    nextAction:
      "Validate whether a warehouse buying window exists before outreach.",
  };
}

export const strongOpportunityFixture: AgentResult = {
  id: "fixture-strong",
  companyName: "Example Retail Ltd",
  industry: "Retail",
  eventType: "New fulfilment centre",
  location: "Bengaluru, India",
  eventDate: null,
  signals: ["new_warehouse", "new_fulfilment_centre", "regional_expansion"],
  evidence: [
    {
      text: "The company announced a new fulfilment centre in Bengaluru.",
      signal: "new_warehouse",
      citationIndex: null,
    },
    {
      text: "The company announced a new fulfilment centre in Bengaluru.",
      signal: "new_fulfilment_centre",
      citationIndex: null,
    },
    {
      text: "The Bengaluru launch expands the company's regional fulfilment network.",
      signal: "regional_expansion",
      citationIndex: null,
    },
  ],
  citations: [],
  ...scoreSignals([
    "new_warehouse",
    "new_fulfilment_centre",
    "regional_expansion",
  ]),
  recommendedSolution: "Warehouse management and inventory visibility",
  reasoning:
    "The announced facility creates a grounded need for inventory and operational control.",
  recommendedContactRole: "VP Supply Chain or Head of Warehouse Operations",
  nextAction:
    "Validate the facility timeline and initiate contextual outreach.",
  linkedinMessage:
    "I noticed your Bengaluru fulfilment-centre announcement. Would comparing launch-stage inventory workflows be useful?",
  emailOpener:
    "Your announced Bengaluru facility suggests the team is preparing for a meaningful increase in fulfilment operations.",
  confidence: 0.88,
};
