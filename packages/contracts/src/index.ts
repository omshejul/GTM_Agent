export const signals = [
  "new_warehouse",
  "warehouse_lease",
  "automation_investment",
  "leadership_hiring",
  "regional_expansion",
  "growth_funding",
  "recent_event",
  "weak_evidence",
] as const;

export type Signal = (typeof signals)[number];
export type IntentBand = "high_priority" | "strong_prospect" | "early_signal" | "low_confidence";
export type AgentErrorCode = "INVALID_INPUT" | "RESEARCH_FAILED" | "AI_FAILED" | "INVALID_AI_OUTPUT";

export interface GenerateOpportunityInput {
  sellerSolution: string;
  targetIndustry?: string;
  targetRegion?: string;
  sourceText?: string;
  sourceUrl?: string;
  companyName?: string;
  researchWithLinkUp: boolean;
}

export interface Citation { url: string; title: string; publishedAt: string | null }
export interface Evidence { text: string; signal: Signal; citationIndex: number | null }
export interface ScoreLine { signal: Signal; points: number }

export interface AgentResult {
  id: string;
  companyName: string | null;
  industry: string | null;
  eventType: string | null;
  location: string | null;
  eventDate: string | null;
  signals: Signal[];
  evidence: Evidence[];
  citations: Citation[];
  scoreBreakdown: ScoreLine[];
  intentScore: number;
  intentBand: IntentBand;
  recommendedSolution: string;
  reasoning: string;
  recommendedContactRole: string;
  nextAction: string;
  linkedinMessage: string;
  emailOpener: string;
  confidence: number;
}

export const scoreWeights: Record<Signal, number> = {
  new_warehouse: 30,
  warehouse_lease: 25,
  automation_investment: 20,
  leadership_hiring: 15,
  regional_expansion: 15,
  growth_funding: 10,
  recent_event: 10,
  weak_evidence: -10,
};

export function scoreSignals(input: readonly Signal[]) {
  const unique = [...new Set(input)];
  const scoreBreakdown = unique.map((signal) => ({ signal, points: scoreWeights[signal] }));
  const intentScore = Math.max(0, Math.min(100, scoreBreakdown.reduce((sum, line) => sum + line.points, 0)));
  const intentBand: IntentBand = intentScore >= 80 ? "high_priority" : intentScore >= 60 ? "strong_prospect" : intentScore >= 40 ? "early_signal" : "low_confidence";
  return { scoreBreakdown, intentScore, intentBand };
}

export const strongOpportunityFixture: AgentResult = {
  id: "fixture-strong",
  companyName: "Example Retail Ltd",
  industry: "Retail",
  eventType: "New fulfilment centre",
  location: "Bengaluru, India",
  eventDate: null,
  signals: ["new_warehouse", "leadership_hiring", "recent_event"],
  evidence: [{ text: "The company announced a new fulfilment centre in Bengaluru.", signal: "new_warehouse", citationIndex: null }],
  citations: [],
  ...scoreSignals(["new_warehouse", "leadership_hiring", "recent_event"]),
  recommendedSolution: "Warehouse management and inventory visibility",
  reasoning: "The announced facility creates a grounded need for inventory and operational control.",
  recommendedContactRole: "VP Supply Chain or Head of Warehouse Operations",
  nextAction: "Validate the facility timeline and initiate contextual outreach.",
  linkedinMessage: "I noticed your Bengaluru fulfilment-centre announcement. Would comparing launch-stage inventory workflows be useful?",
  emailOpener: "Your announced Bengaluru facility suggests the team is preparing for a meaningful increase in fulfilment operations.",
  confidence: 0.88,
};
