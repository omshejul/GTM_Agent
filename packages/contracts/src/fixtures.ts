import type { Signal } from "./index";

export interface DemoOpportunityFixture {
  id: string;
  title: string;
  fictional: true;
  sourceText: string;
  expectedSignals: Signal[];
}

export const demoOpportunityFixtures: DemoOpportunityFixture[] = [
  {
    id: "india-strong-warehouse",
    title: "Fictional Bengaluru warehouse expansion",
    fictional: true,
    sourceText:
      "Fictional retailer Saffron Cart announced a new warehouse in Bengaluru, Karnataka.",
    expectedSignals: ["new_warehouse"],
  },
  {
    id: "india-fulfilment-launch",
    title: "Fictional Chennai fulfilment-centre launch",
    fictional: true,
    sourceText:
      "Fictional ecommerce company Monsoon Basket opened a new fulfilment centre in Chennai, Tamil Nadu.",
    expectedSignals: ["new_fulfilment_centre"],
  },
  {
    id: "india-hiring-expansion",
    title: "Fictional Pune warehouse hiring",
    fictional: true,
    sourceText:
      "Fictional manufacturer Deccan Works began hiring 120 warehouse roles in Pune, Maharashtra.",
    expectedSignals: ["warehouse_hiring"],
  },
  {
    id: "india-funding-only",
    title: "Fictional funding without operations evidence",
    fictional: true,
    sourceText:
      "Fictional FMCG company Neem Foods announced funding without describing warehouse operations.",
    expectedSignals: ["funding_announcement"],
  },
  {
    id: "india-irrelevant",
    title: "Fictional irrelevant product announcement",
    fictional: true,
    sourceText:
      "Fictional retailer Lotus Lane announced a customer loyalty mobile application.",
    expectedSignals: [],
  },
];
