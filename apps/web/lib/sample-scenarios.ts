import type { GenerateOpportunityInput, IntentBand } from "@ai-gtm/contracts";

export interface SampleScenario {
  id: "strong" | "moderate" | "funding-only" | "irrelevant" | "multi-signal";
  label: string;
  expectedBandForQaOnly: IntentBand;
  input: GenerateOpportunityInput;
}

const base = {
  sellerSolution: "Warehouse management and inventory visibility",
  targetIndustry: "Retail",
  targetRegion: "India",
  sourceUrl: "",
  researchWithLinkUp: false,
} satisfies Omit<GenerateOpportunityInput, "companyName" | "sourceText">;

export const sampleScenarios: SampleScenario[] = [
  {
    id: "strong",
    label: "Strong warehouse launch",
    expectedBandForQaOnly: "early_signal",
    input: {
      ...base,
      companyName: "Example Retail Ltd",
      sourceText: "Example Retail Ltd announced a new fulfilment centre in Bengaluru and is hiring warehouse operations leadership for the launch.",
    },
  },
  {
    id: "moderate",
    label: "Moderate regional expansion",
    expectedBandForQaOnly: "early_signal",
    input: {
      ...base,
      companyName: "Regional Commerce Co",
      sourceText: "Regional Commerce Co plans to expand distribution into two southern states over the next year.",
    },
  },
  {
    id: "funding-only",
    label: "Funding without warehouse evidence",
    expectedBandForQaOnly: "low_confidence",
    input: {
      ...base,
      companyName: "Funded Marketplace",
      sourceText: "Funded Marketplace raised a new growth round to invest in product and brand awareness.",
    },
  },
  {
    id: "irrelevant",
    label: "Irrelevant company update",
    expectedBandForQaOnly: "low_confidence",
    input: {
      ...base,
      companyName: "Example Retail Ltd",
      sourceText: "Example Retail Ltd launched a seasonal creative campaign featuring a new brand ambassador.",
    },
  },
  {
    id: "multi-signal",
    label: "Multi-signal expansion",
    expectedBandForQaOnly: "high_priority",
    input: {
      ...base,
      companyName: "Scale Retail Group",
      sourceText: "Scale Retail Group leased a new warehouse, announced automation investment, hired a Head of Warehouse Operations, and expanded into a new region this quarter.",
    },
  },
];

export const primarySample = sampleScenarios[0]!;
