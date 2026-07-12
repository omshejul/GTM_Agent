import type { AgentResult, Signal } from "./index";

export const leadRoastTones = [
  "professional_wit",
  "sales_team_spicy",
  "workplace_safe_unhinged",
] as const;
export type LeadRoastTone = (typeof leadRoastTones)[number];

export interface LeadRoast {
  generationId: string;
  tone: LeadRoastTone;
  promptVersion: "v1";
  variant: number;
  headline: string;
  oneLineRoast: string;
  expansionEnergy: string;
  diagnosis: string;
  recommendedTreatment: string;
  citedSignalIds: Signal[];
  shareCardText: string;
  aiGenerated: true;
}

export class LeadRoastError extends Error {
  constructor(
    readonly code:
      | "INVALID_ROAST_TONE"
      | "INSUFFICIENT_ROAST_EVIDENCE"
      | "UNSAFE_ROAST_OUTPUT",
    message: string,
  ) {
    super(message);
  }
}

const unsafeTopics =
  /\b(layoffs?|fired|death|dead|injur(?:y|ed)|accident|disab(?:ility|led)|religion|race|ethnic|gender|sexual|pregnan|suicide|tragedy)\b/i;

export function moderateLeadRoast(value: string) {
  if (unsafeTopics.test(value)) {
    throw new LeadRoastError(
      "UNSAFE_ROAST_OUTPUT",
      "Roast output contains a prohibited workplace-safety topic",
    );
  }
  return value;
}

export function generateDeterministicLeadRoast(
  result: AgentResult,
  tone: LeadRoastTone,
  variant = 0,
): LeadRoast {
  if (!(leadRoastTones as readonly string[]).includes(tone)) {
    throw new LeadRoastError("INVALID_ROAST_TONE", "Unsupported roast tone");
  }
  const groundedSignals = result.signals.filter((signal) =>
    result.evidence.some((evidence) => evidence.signal === signal),
  );
  if (!groundedSignals.length) {
    throw new LeadRoastError(
      "INSUFFICIENT_ROAST_EVIDENCE",
      "The opportunity has no grounded signal to roast",
    );
  }
  const company = result.companyName ?? "This company";
  const signalLabel = groundedSignals[0]!.replaceAll("_", " ");
  const oneLineByTone: Record<LeadRoastTone, string[]> = {
    professional_wit: [
      `${company} announced ${signalLabel} and gave the sales team a remarkably well-labelled buying signal.`,
      `${company} supplied ${signalLabel}; even the cautious forecast can call that a useful signal.`,
      `${company} documented ${signalLabel}, saving the pipeline review from another round of guesswork.`,
    ],
    sales_team_spicy: [
      `${company} practically put ${signalLabel} in the subject line and your follow-up is still in drafts.`,
      `${company} served ${signalLabel} on a slide, and the CRM is still asking for next steps.`,
      `${company} published ${signalLabel}; the only cold thing left should not be the outreach.`,
    ],
    workplace_safe_unhinged: [
      `${company} activated ${signalLabel}; the warehouse has more momentum than the pipeline review.`,
      `${company} dropped ${signalLabel} into the timeline and the sales dashboard briefly achieved consciousness.`,
      `${company} confirmed ${signalLabel}; somewhere, a spreadsheet just requested operational support.`,
    ],
  };
  const normalizedVariant = Math.max(0, Math.floor(variant));
  const options = oneLineByTone[tone];
  const oneLineRoast = moderateLeadRoast(
    options[normalizedVariant % options.length]!,
  );
  const expansionEnergy = `${result.intentScore}/100 · ${result.intentBand.replaceAll("_", " ")}`;
  const diagnosis = `Grounded ${signalLabel} expansion energy`;
  const recommendedTreatment = `${result.recommendedSolution} before spreadsheet season returns`;
  return {
    generationId: result.id,
    tone,
    promptVersion: "v1",
    variant: normalizedVariant,
    headline: `Expansion Energy: ${result.intentScore}/100`,
    oneLineRoast,
    expansionEnergy,
    diagnosis,
    recommendedTreatment,
    citedSignalIds: groundedSignals,
    shareCardText: `${oneLineRoast}\nDiagnosis: ${diagnosis}\nRecommended treatment: ${recommendedTreatment}`,
    aiGenerated: true,
  };
}
