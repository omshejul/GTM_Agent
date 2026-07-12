# Plan A — Intelligence, Data, and Integrations

> **Runtime decision:** Hermes is a development/orchestration assistant only, not a product dependency. References to Hermes below mean the direct OpenAI-compatible AI adapter, implemented as `convex/ai.ts` and configured with `OPENAI_API_KEY`, `OPENAI_MODEL`, and optional `OPENAI_BASE_URL`.

## AI GTM OS: Warehouse Expansion Agent

**Owner:** Teammate A  
**Primary area:** Convex backend, Hermes intelligence, LinkUp research, analytics storage, and payment backend  
**Estimated effort:** 3–4 hours  
**Works in parallel with:** Plan B — Next.js Product Experience

## Stack

- **Backend and database:** Convex
- **AI:** Hermes
- **Search and company research:** LinkUp
- **Analytics:** First-party events stored in Convex
- **Payments:** Dodo Payments for the Revenue track
- **Language:** TypeScript

## Goal

Build the server-side intelligence pipeline and persistent data model. The backend accepts an ICP and source material, optionally researches a company with LinkUp, asks Hermes to extract evidence-grounded expansion signals and outreach, applies deterministic scoring, stores the generation, and returns a stable typed result to the Next.js application.

## Files owned by this track

```text
convex/
├── schema.ts
├── opportunities.ts
├── generations.ts
├── analytics.ts
├── research.ts
├── hermes.ts
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
  sourceText?: string;
  sourceUrl?: string;
  companyName?: string;
  researchWithLinkUp: boolean;
};
```

The result must include company, industry, event type, location, event date, detected signals, evidence, score breakdown, intent score/band, recommended solution, reasoning, contact role, next action, LinkedIn message, email opener, confidence, and source citations.

Unknown facts must be `null`; Hermes must never invent them. Return stable machine-readable error codes such as `INVALID_INPUT`, `RESEARCH_FAILED`, `AI_FAILED`, and `INVALID_AI_OUTPUT`.

## Convex data model

Create the minimum tables needed for the MVP:

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
- Validate required seller solution and at least one source: text, URL, or company name for LinkUp research.
- Constrain confidence to 0–1 and score to 0–100.
- Define a controlled signal vocabulary.
- Give Plan B a valid fixture immediately.

### 2. Add LinkUp research

Use LinkUp only when the user asks the product to analyze a website or company.

- Research the supplied company/domain and warehouse-expansion signals.
- Preserve source URLs, titles, dates, and short evidence snippets.
- Apply request timeouts and return a clear recoverable error.
- Pass normalized research context and citations to Hermes.
- Never claim that absence of search evidence proves absence of expansion.
- Make the feature optional so pasted source text works without LinkUp.

### 3. Implement Hermes intelligence

- Invoke Hermes from a Convex action or a narrowly scoped server-side adapter.
- Ask Hermes for strict JSON matching the shared contract.
- Extract company/event facts, controlled signals, evidence, confidence, solution fit, buyer role, next action, and outreach.
- Ground every claim in supplied text or LinkUp sources.
- Reject or repair malformed output once; otherwise return `INVALID_AI_OUTPUT`.
- Store useful model/run metadata without storing secrets.

### 4. Implement deterministic scoring

Keep numeric scoring in TypeScript, outside Hermes:

| Signal | Weight |
|---|---:|
| New warehouse or fulfilment centre | 30 |
| Warehouse lease or property acquisition | 25 |
| Automation investment | 20 |
| Warehouse/supply-chain leadership hiring | 15 |
| Regional expansion | 15 |
| Funding linked to operational growth | 10 |
| Event within 90 days | 10 |
| Weak or unverified evidence | -10 |

- Deduplicate signals.
- Cap at 100 and floor at 0.
- Map 80–100 to high priority, 60–79 to strong prospect, 40–59 to early signal, and 0–39 to low confidence.
- Return a line-item score breakdown for the UI.

### 5. Build the Convex orchestration action

```text
validate input
→ optionally research with LinkUp
→ call Hermes for structured extraction
→ score deterministically
→ validate final result
→ store generation/opportunity
→ record generation analytics event
→ return AgentResult
```

Make mutations idempotent where retries could create duplicates. Ensure user/visitor authorization prevents private generations from being read by another user.

### 6. Add first-party analytics

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

Validate allowed event names and properties. Do not store sensitive article contents or secrets in analytics properties.

### 7. Add share persistence

- Create an unguessable public share token.
- Store only the result fields intended for public viewing.
- Return a read-only shared result.
- Record share creation and view events.
- Allow future expiry/revocation without redesigning the schema.

### 8. Add Dodo Payments backend for the Revenue track

- Create checkout server-side using Dodo Payments.
- Add an authenticated webhook endpoint through Convex HTTP actions.
- Verify webhook signatures and process events idempotently.
- Persist customer, subscription, and entitlement state.
- Expose a typed query for Plan B to determine free versus paid access.
- Never trust a client-only success redirect as proof of payment.

Keep payment work feature-gated so it cannot block the core buildathon demo.

### 9. Test

Cover scoring weights/caps, duplicates, weak evidence, validators, authorization, malformed Hermes output, LinkUp failure, generation persistence, analytics validation, share-token access, and payment webhook idempotency.

## Early handoff to Plan B

Deliver within the first checkpoint:

1. `lib/contracts.ts` with final field names.
2. A static `AgentResult` fixture.
3. Convex API names and expected error codes.
4. Analytics event names.
5. Required environment-variable names without values.

## Definition of done

- The Convex action returns a validated, evidence-grounded `AgentResult`.
- LinkUp research works when enabled and remains optional.
- Scoring is deterministic and tested.
- Generations, shares, and analytics events persist in Convex.
- Private results are authorization-safe.
- Dodo webhooks are verified and idempotent for the Revenue track.
- Plan B integrates through stable Convex functions without duplicating intelligence logic.
