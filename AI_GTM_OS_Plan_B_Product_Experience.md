# Plan B — Next.js Product Experience

> **Runtime decision:** The Convex backend calls an OpenAI-compatible model API directly; the frontend never receives its credentials.

## AI GTM OS: Warehouse Expansion Agent

**Owner:** Teammate B  
**Primary area:** Next.js interface, shadcn/ui design system, Convex client integration, sharing, revenue UI, and Cloudflare deployment  
**Estimated effort:** 3–4 hours  
**Works in parallel with:** Plan A — Intelligence, Data, and Integrations

## Stack

- **Frontend:** Next.js App Router with TypeScript
- **UI:** Tailwind CSS and shadcn/ui
- **Backend client:** Convex React client
- **Hosting:** Cloudflare Workers
- **Analytics:** Visitor, signup, generation, and share events written to Convex
- **Payments:** Dodo Payments checkout for the Revenue track

## Goal

Build a polished web product that collects ICP and source inputs, invokes Plan A's Convex action, explains the evidence and deterministic score, presents human-reviewed outreach, supports public result sharing, and deploys on Cloudflare Workers.

Use Plan A's typed fixture until its action is ready. Do not reproduce AI prompts, research, or scoring in React components.

## Files owned by this track

```text
app/
├── layout.tsx
├── page.tsx
├── analyze/page.tsx
├── results/[id]/page.tsx
├── share/[token]/page.tsx
├── pricing/page.tsx
└── globals.css
components/
├── analysis-form.tsx
├── opportunity-dashboard.tsx
├── score-card.tsx
├── evidence-list.tsx
├── outreach-card.tsx
├── share-dialog.tsx
└── ui/
lib/
├── analytics-client.ts
├── visitor.ts
└── formatters.ts
public/
README.md
package.json
wrangler.jsonc
```

Avoid editing Convex schema, AI/LinkUp adapters, scoring, payment webhooks, or backend authorization owned by Plan A.

## Shared integration contract

Plan A provides:

```ts
generateOpportunity(input: GenerateOpportunityInput): Promise<AgentResult>
```

Plan B renders the returned object and maps known error codes to friendly messages. Treat the Convex-generated API and `lib/contracts.ts` as the shared boundary.

## Tasks

### 1. Initialize the application

- Create a Next.js App Router project with strict TypeScript.
- Configure Tailwind CSS and shadcn/ui.
- Add Convex and connect `ConvexProvider` at the correct client boundary.
- Add Cloudflare's supported Next.js adapter and Wrangler configuration.
- Create `.env.example` using placeholder variable names only.
- Keep all model-provider, LinkUp, Convex deployment, and Dodo secrets server-side.

Confirm local commands for Next.js, Convex dev, tests, and Cloudflare preview.

### 2. Establish the design system

Use shadcn/ui primitives such as Button, Card, Input, Textarea, Select, Badge, Progress, Alert, Dialog, Tabs, Skeleton, and Toast.

Build a clean B2B intelligence interface with:

- Responsive desktop/mobile layout
- Accessible labels, focus states, and keyboard flow
- Clear loading, empty, success, and failure states
- Strong visual emphasis on evidence and intent score
- No unnecessary animation or heavy dashboard chrome

### 3. Build the analysis flow

Inputs:

- Seller solution
- Target industry
- Target region
- Company name
- Source URL
- Source text
- Toggle to research the company/website with LinkUp
- Sample scenario loader

Require at least source text, a URL, or a company name with LinkUp enabled. Explain that research may take longer. Preserve form content after recoverable errors.

### 4. Build the opportunity dashboard

Show:

- Company and event summary
- Intent score, band, and line-item breakdown
- Confidence
- Detected signals
- Evidence with clickable source citations
- Recommended solution and reasoning
- Recommended contact role and next action
- LinkedIn message and email opener

Label outreach as draft content requiring human review. Never add automatic sending.

### 5. Integrate Convex

- Call Plan A's action and render its typed result.
- Use Convex queries for saved generations and shares.
- Map `INVALID_INPUT`, `RESEARCH_FAILED`, `AI_FAILED`, and `INVALID_AI_OUTPUT` to actionable alerts.
- Do not calculate or modify scores client-side.
- Use optimistic UI only for safe operations such as initiating a share, not for generation completion or payment state.

### 6. Add first-party product analytics

Generate and persist a privacy-safe anonymous visitor ID. Send these events to Plan A's Convex mutation:

- First meaningful visit → `visitor_started`
- Successful account creation → `signup_completed`
- Analyze click → `generation_started`
- Successful result → `generation_completed`
- Failed result → `generation_failed`
- Share link creation → `share_created`
- Public share load → `share_viewed`

Avoid duplicate events during React re-renders. Never include full source text, outreach content, credentials, or sensitive personal data in event properties.

### 7. Build public sharing

- Add a share action/dialog to completed results.
- Request a server-generated share token from Convex.
- Create a read-only `/share/[token]` page.
- Include company, evidence, score, recommendation, and outreach only if Plan A marks those fields public.
- Provide copy-link feedback and sensible social metadata.

### 8. Add Dodo Payments UI for the Revenue track

- Create a pricing page and paid-plan call to action.
- Start checkout using Plan A's server-side Dodo function.
- Handle cancel and success return states clearly.
- Read entitlement from Convex before unlocking paid features.
- Never unlock access based only on URL parameters or client state.

Keep the Revenue track feature-gated so the core analysis demo remains usable if payment configuration is incomplete.

### 9. Add sample scenarios

Prepare strong, moderate, funding-only, irrelevant, and multi-signal examples. Make one sample loadable in one click for demo reliability. Expected intent labels are for QA only; do not hard-code scores.

### 10. Deploy to Cloudflare Workers

- Verify the chosen Next.js APIs are compatible with the Cloudflare runtime.
- Avoid unsupported Node-only APIs in frontend/server route code.
- Configure build and preview commands in `package.json`.
- Set public configuration through Cloudflare environment bindings and secrets through secure provider configuration.
- Run a production-style preview before deployment.
- Verify Next.js routes, Convex connectivity, public share pages, and Dodo return URLs on the deployed origin.

### 11. Document and prepare the demo

README must explain architecture, setup, environment variables, local development, Convex deployment, Cloudflare deployment, LinkUp behavior, direct model integration, analytics events, Dodo configuration, tests, and troubleshooting.

Demo sequence:

1. Explain static ICP fit versus an active buying window.
2. Analyze a strong warehouse-expansion example.
3. Show LinkUp citations, verified evidence, and scoring breakdown.
4. Show the recommended buyer and human-reviewed outreach.
5. Create a public share link.
6. Analyze a weak example to prove the product does not rank everything highly.
7. If ready, briefly show the Revenue-track upgrade path.

## Coordination checkpoints

### Git coordination

- Pull with `git pull --rebase origin main` before each focused frontend work block and again immediately before pushing.
- Commit and push small, verified UI increments rather than holding a large local batch.
- Pull contract and fixture changes from Plan A before wiring each integration; do not locally duplicate or work around a stale contract.
- Never force-push shared `main`; resolve rebases locally and rerun affected checks.

### First 20 minutes

- Agree on shared TypeScript contracts, Convex function names, error codes, and analytics event names.
- Receive Plan A's fixture and mock the action boundary only.

### Midpoint

- Replace the fixture with the real Convex action.
- Test a successful generation, LinkUp failure, and AI-provider failure.
- Report contract mismatches rather than working around them in components.

### Final

- Run tests and Cloudflare production preview.
- Verify analytics event deduplication and share visibility.
- Test free/paid entitlement behavior if Revenue is enabled.
- Rehearse strong and weak scenarios, then freeze features.

## Definition of done

- The App Router application works locally and in Cloudflare preview.
- Tailwind and shadcn/ui provide a responsive, accessible interface.
- The UI uses Convex as its only backend and does not duplicate intelligence logic.
- Visitor, signup, generation, and share events are stored in Convex.
- LinkUp citations appear for researched sources.
- Sharing works through a read-only public page.
- Dodo checkout and entitlement UI are ready for the Revenue track or safely feature-gated.
- No secrets reach the browser and no outreach is sent automatically.
