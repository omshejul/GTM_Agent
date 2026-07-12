# Plan A — Intelligence, Data, and Integrations

> **Runtime decision:** The product calls an OpenAI-compatible model through `convex/ai.ts`, configured with `OPENAI_API_KEY`, `OPENAI_MODEL`, and optional `OPENAI_BASE_URL`.

## AI GTM OS: Warehouse Expansion Agent

**Owner:** Teammate A  
**Primary area:** Convex backend, AI intelligence, LinkUp research, analytics storage, and payment backend
**Estimated effort:** 3–4 hours  
**Works in parallel with:** Plan B — Next.js Product Experience

## MVP product scope

This is the first autonomous agent inside a future AI GTM Operating System, not the complete platform. The buildathon MVP is an India-first **ICP Discovery Agent for Warehouse Expansion Intelligence**.

Its core job is simple: a user pastes a public company announcement, and the product determines whether the company is entering a warehouse-related buying window. It converts the announcement into structured, explainable B2B sales intelligence in approximately one analysis flow.

The production-quality core must remain lightweight enough to demo reliably within four hours. The critical path requires no authentication, CRM integration, automated outreach, live news scraping, background jobs, multi-agent orchestration, payment, or deployment. Existing Convex capabilities may support the monorepo architecture, but persistence and all external integrations must be optional and must never block local pasted-text analysis.

### India-first inputs

- Seller solution: Warehouse Management System, Warehouse Automation, Robotics, Inventory Software, Material Handling, 3PL Services, or Custom
- Target industry: Retail, Ecommerce, Manufacturing, Logistics, or FMCG
- Target state/region: an Indian state or operating region, including Karnataka, Tamil Nadu, Maharashtra, Telangana, Delhi NCR, and Gujarat
- Optional company name
- Required pasted company announcement or article for the core flow

### Required result

Return company, location, industry, expansion type, detected signals with evidence, intent score, priority, confidence, recommended solution, recommended buyer, next best action, LinkedIn message, and email opener. The result must be downloadable as JSON. Unknown facts remain `null`, and outreach is always a human-reviewed draft.

## Stack

- **Backend and database:** Convex
- **AI:** Direct OpenAI-compatible API with structured output
- **Search and company research:** LinkUp
- **Analytics:** First-party events stored in Convex
- **Payments:** Dodo Payments for the Revenue track
- **Language:** TypeScript

The original lightweight brief proposed Streamlit, Python, Pydantic, and JSON-only storage. This repository keeps the already-selected Next.js/Convex TypeScript monorepo, while preserving the same single-page product behavior and strict structured validation. Architecture must not expand the user-facing MVP scope.

## Goal

Build the server-side intelligence pipeline and persistent data model. The backend accepts an ICP and source material, optionally researches a company with LinkUp, calls an OpenAI-compatible model to extract evidence-grounded expansion signals and outreach, applies deterministic scoring, stores the generation, and returns a stable typed result to the Next.js application.

## Files owned by this track

```text
convex/
├── schema.ts
├── opportunities.ts
├── generations.ts
├── analytics.ts
├── research.ts
├── ai.ts
├── scoring.ts
├── payments.ts
└── http.ts
lib/
├── contracts.ts
└── scoring-config.ts
prompts/
├── extract-signals.md
└── generate-outreach.md
tests/
├── scoring.test.ts
└── contracts.test.ts
```

Avoid editing Next.js routes, React components, Tailwind styles, or shadcn/ui components owned by Plan B.

## Shared contract — freeze this first

Plan B calls one Convex action:

```ts
generateOpportunity(input: GenerateOpportunityInput): Promise<AgentResult>
```

```ts
export type GenerateOpportunityInput = {
  sellerSolution: string;
  targetIndustry?: string;
  targetRegion?: string;
  targetState?: string;
  sourceText?: string;
  sourceUrl?: string;
  companyName?: string;
  researchWithLinkUp: boolean;
};
```

The result must include company, industry, event/expansion type, location, event date, detected signals, evidence, score breakdown, intent score/priority, recommended solution, reasoning, recommended buyer/contact role, next best action, LinkedIn message, email opener, confidence, and source citations.

Unknown facts must be `null`; the model must never invent them. Return stable machine-readable error codes such as `INVALID_INPUT`, `RESEARCH_FAILED`, `AI_FAILED`, and `INVALID_AI_OUTPUT`.

## Optional Convex data model

These tables support the expanded product path but are not required for the four-hour pasted-text demo:

- `visitors`: anonymous visitor ID, first/last seen time, attribution fields
- `users`: identity reference and signup time when authentication is enabled
- `opportunities`: normalized company/event result and owner/visitor reference
- `generations`: input, result, model metadata, status, timestamps, and error code
- `analyticsEvents`: visitor/user ID, event name, properties, and timestamp
- `shares`: public share token, generation reference, created time, and optional expiry
- `subscriptions`: Dodo customer/subscription/product IDs and current entitlement state
- `webhookEvents`: provider event ID and processing status for idempotency

Keep secrets in Convex environment variables, never in client-visible Next.js variables.

## Tasks

### 1. Define contracts and validators

- Create shared TypeScript types and Convex validators.
- Validate the controlled seller solutions, industries, and India state/region values while allowing `Custom` seller input.
- Require pasted source text for the core flow. URL/company-only analysis is enabled only when optional LinkUp research is configured.
- Constrain confidence to 0–1 and score to 0–100.
- Define a controlled signal vocabulary.
- Give Plan B a valid fixture immediately.

### 2. Add LinkUp research (stretch)

Use LinkUp only when the user asks the product to analyze a website or company.

- Research the supplied company/domain and warehouse-expansion signals.
- Preserve source URLs, titles, dates, and short evidence snippets.
- Apply request timeouts and return a clear recoverable error.
- Pass normalized research context and citations to the AI adapter.
- Never claim that absence of search evidence proves absence of expansion.
- Make the feature optional so pasted source text works without LinkUp.

### 3. Implement AI intelligence

- Invoke the OpenAI-compatible API from a narrowly scoped `convex/ai.ts` server-side adapter.
- Request strict JSON matching the shared contract, using structured output when the configured provider supports it.
- Read `OPENAI_API_KEY`, `OPENAI_MODEL`, and optional `OPENAI_BASE_URL` only from Convex environment variables.
- Extract company/event facts, controlled signals, evidence, confidence, solution fit, buyer role, next action, and outreach.
- Ground every claim in supplied text or LinkUp sources.
- Treat the model as a B2B GTM analyst: extract facts and signals from the announcement and return JSON only.
- Reject or repair malformed output once; otherwise return `INVALID_AI_OUTPUT`.
- Store useful model/run metadata without storing secrets.

### 4. Implement deterministic scoring

Keep numeric scoring in TypeScript, outside the model:

| Signal | Weight |
|---|---:|
| New warehouse | 30 |
| New fulfilment centre | 25 |
| Warehouse hiring | 20 |
| Regional expansion | 15 |
| Automation investment | 10 |
| Funding announcement | 10 |

- Deduplicate signals.
- Cap at 100 and floor at 0.
- Map 70–100 to high priority, 40–69 to medium priority, and 0–39 to low priority.
- Return a line-item score breakdown for the UI.

### 4.1 Implement deterministic recommendation rules

Use clear rules before asking the model to phrase the explanation:

| Dominant need | Recommended solution | Recommended buyer |
|---|---|---|
| New warehouse | Warehouse Management System | Head of Warehouse Operations |
| Warehouse hiring | Workforce Planning | Head of Warehouse Operations |
| Automation investment | Robotics or Warehouse Automation | Operations Director |
| Inventory pressure | Inventory Software | Supply Chain Manager |
| Regional/3PL expansion | 3PL Services | Logistics Director |

Return a useful next action such as validating the launch timeline or contacting the recommended buyer within 30 days. Do not fabricate urgency or claim a buying process exists without evidence.

### 5. Build the Convex orchestration action

```text
validate input
→ optionally research with LinkUp
→ call the AI adapter for structured extraction
→ score deterministically
→ validate final result
→ store generation/opportunity
→ record generation analytics event
→ return AgentResult
```

Make mutations idempotent where retries could create duplicates. Ensure user/visitor authorization prevents private generations from being read by another user.

### 6. Add first-party analytics (stretch)

Provide a small mutation such as:

```ts
trackEvent({ visitorId, userId?, name, properties? })
```

Support these MVP events:

- `visitor_started`
- `signup_completed`
- `generation_started`
- `generation_completed`
- `generation_failed`
- `share_created`
- `share_viewed`
- `lead_roast_generated`
- `lead_roast_shared`

Validate allowed event names and properties. Do not store sensitive article contents or secrets in analytics properties.

### 7. Add share persistence (stretch)

- Create an unguessable public share token.
- Store only the result fields intended for public viewing.
- Return a read-only shared result.
- Record share creation and view events.
- Allow future expiry/revocation without redesigning the schema.

### 8. Add “Roast This Lead” viral output (stretch)

Create an optional, shareable layer that turns a completed opportunity analysis into workplace-safe sales humor without weakening evidence standards.

- Expose a typed backend action such as `generateLeadRoast({ generationId, tone })`.
- Support three controlled tones: `professional_wit`, `sales_team_spicy`, and `workplace_safe_unhinged`.
- Return a structured `LeadRoast` containing a headline, one-line roast, expansion-energy score label, diagnosis, recommended treatment, cited signal IDs, and share-card text.
- Generate humor only from the already validated `AgentResult`; never send raw unverified research directly to the roast prompt.
- Require every joke to trace to at least one detected signal or evidence item. If there is insufficient evidence, return `INSUFFICIENT_ROAST_EVIDENCE` instead of inventing material.
- Target corporate announcements, sales situations, and operational patterns—not individual employees, protected traits, layoffs, tragedies, safety incidents, or personal hardship.
- Keep the feature opt-in and label its output as AI-generated. Never publish or post automatically.
- Store the selected public roast fields with the share record so public links remain stable even if prompts change later.
- Add deterministic moderation checks before persistence, rate-limit generation, and record `lead_roast_generated` and `lead_roast_shared` without storing the full joke in analytics properties.
- Make the action idempotent for the same generation, tone, and prompt version unless the user explicitly requests a new variant.

Example output:

```text
Expansion Energy: 87/100
“They leased 400,000 sq ft, hired a VP of Logistics, and still haven't replied to your email.”
Diagnosis: Acute Warehouse Growth
Recommended treatment: WMS before spreadsheet season returns
```

Keep this feature-gated so it cannot block the core analysis and sharing demo.

### 9. Add Dodo Payments backend for the Revenue track (post-MVP)

- Create checkout server-side using Dodo Payments.
- Add an authenticated webhook endpoint through Convex HTTP actions.
- Verify webhook signatures and process events idempotently.
- Persist customer, subscription, and entitlement state.
- Expose a typed query for Plan B to determine free versus paid access.
- Never trust a client-only success redirect as proof of payment.

Keep payment work feature-gated so it cannot block the core buildathon demo.

### 10. Test

Cover scoring weights/caps, duplicates, weak evidence, validators, authorization, malformed model output, AI-provider failure, LinkUp failure, generation persistence, analytics validation, share-token access, roast evidence grounding, tone validation, moderation rejection, roast idempotency, and payment webhook idempotency.

For the core acceptance path, explicitly test empty input, no detected signal, multiple signals, unknown company, contradictory content, unsupported facts, malformed JSON, and API failure.

### 11. Add safe demo fixtures

Create at least five fictional or summarized Indian company announcements covering strong warehouse expansion, fulfilment-centre launch, hiring-led expansion, funding without operational evidence, and irrelevant content. Companies may be inspired by Flipkart, Amazon India, Reliance Retail, Delhivery, Blue Dart, Zepto, Blinkit, or BigBasket, but fixtures must not imply fabricated real-world events and must not require live scraping.

## Git coordination

- Pull with `git pull --rebase origin main` before each focused backend work block and again immediately before pushing.
- Commit and push small, verified backend increments so Plan B receives contracts, fixtures, and Convex functions continuously.
- Keep shared-contract changes in their own commits and announce them before dependent implementation changes.
- Never force-push shared `main`; resolve rebases locally and rerun affected tests.

## Early handoff to Plan B

Deliver within the first checkpoint:

1. `lib/contracts.ts` with final field names.
2. A static `AgentResult` fixture.
3. Convex API names and expected error codes.
4. Analytics event names.
5. Required environment-variable names without values.

## Definition of done

- The Convex action returns a validated, evidence-grounded `AgentResult`.
- A user can paste an announcement and receive the complete structured opportunity without enabling research, authentication, persistence, payment, or sharing.
- India-focused seller solution, industry, and state/region inputs are represented in the shared contract.
- LinkUp research works when enabled and remains optional.
- Scoring is deterministic and tested.
- The intent score follows the agreed 0–100 weights and low/medium/high priority bands.
- Each detected signal includes evidence from the supplied announcement.
- Recommendation rules produce a relevant solution, buyer, and next action.
- LinkedIn and email drafts are grounded, copyable by the UI, and never sent automatically.
- Results can be downloaded as JSON.
- At least five safe demo fixtures cover strong, moderate, weak, irrelevant, and multi-signal cases.
- When persistence is enabled, generations, shares, and analytics events persist in Convex and private results are authorization-safe.
- If the post-MVP Revenue track is enabled, Dodo webhooks are verified and idempotent.
- If “Roast This Lead” is enabled, it produces evidence-grounded, workplace-safe, share-ready output and fails closed when evidence is insufficient.
- Plan B integrates through stable Convex functions without duplicating intelligence logic.
