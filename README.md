# AI GTM OS

A Next.js product experience for turning warehouse-expansion evidence into an explainable intent score, a recommended solution, and human-reviewed outreach.

The repository currently contains Plan A's shared TypeScript contract and deterministic fixtures, plus the Plan B product experience. The browser never runs prompts, researches companies, calculates scores, verifies entitlements, or receives provider credentials.

## Architecture

```text
apps/web                 Next.js App Router product
  app/analyze            input, loading, failure, and result flow
  app/results/[id]       saved-result route boundary
  app/share/[token]      read-only public result route
  app/pricing            feature-gated Dodo checkout UI
  components             accessible product and shadcn-style UI primitives
  lib/product-client.ts  typed frontend/backend boundary
  lib/analytics-client   anonymous, deduplicated event client
packages/contracts       shared inputs, results, signals, fixtures, scoring
convex                    Plan A backend ownership boundary (not implemented here)
prompts                   Plan A model prompts; never bundled into the UI
```

`ProductClient` is the single integration seam for `generateOpportunity`, sharing, entitlement checks, checkout, and analytics. Until Plan A's generated Convex API is available, the browser uses `strongOpportunityFixture`. The fixture adapter exists for reliable demos; it must be replaced by Convex calls rather than by moving prompts or scoring into React.

A conditional `ConvexProvider` is installed at the root client boundary whenever `NEXT_PUBLIC_CONVEX_URL` is configured.

## Product routes

- `/` — product landing page
- `/analyze` — ICP/source form and opportunity dashboard
- `/results/fixture-strong` — fixture-backed saved-result route
- `/share/demo-fixture-strong` — read-only demo share with social metadata
- `/pricing` — free demo and feature-gated paid plan

The analysis form requires a seller solution and at least one of source text, source URL, or company name with LinkUp research enabled. Recoverable errors preserve every field. Outreach is always labeled as draft content and is never sent automatically.

## Setup

Requirements: Node 20.19+ and pnpm 10.12+.

```bash
corepack enable
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Open `http://localhost:3000`. Leaving `NEXT_PUBLIC_CONVEX_URL` blank runs fixture mode.

### Environment variables

Browser-safe values:

- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL; blank in fixture mode
- `NEXT_PUBLIC_REVENUE_ENABLED` — shows a live checkout CTA only when `true`

Server-side Convex environment variables (never prefix these with `NEXT_PUBLIC_`):

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL` — optional OpenAI-compatible endpoint
- `LINKUP_API_KEY` — optional research provider
- `DODO_PAYMENTS_API_KEY` — optional Revenue track
- `DODO_WEBHOOK_SECRET` — optional Revenue track webhook verification

Configure backend values with Convex, not in `apps/web/.env.local`:

```bash
pnpm exec convex env set OPENAI_API_KEY '<value>'
pnpm exec convex env set OPENAI_MODEL 'gpt-4.1-mini'
pnpm exec convex dev
```

## Connecting Plan A

Implement a Convex-backed `ProductClient` after Plan A publishes generated function references. The adapter must:

1. call Plan A's `generateOpportunity(input)` action and return `AgentResult` unchanged;
2. query saved generations and read-only shares from Convex;
3. call the server mutation that creates opaque share tokens;
4. send the analytics payloads listed below to Plan A's analytics mutation;
5. call the server-side Dodo checkout action and query server-verified entitlement;
6. map `INVALID_INPUT`, `RESEARCH_FAILED`, `AI_FAILED`, and `INVALID_AI_OUTPUT` through `lib/errors.ts`.

Do not add a browser fallback for research, model calls, scoring, payment verification, or authorization.

## Analytics

The client generates one anonymous UUID, persists it locally, and deduplicates events by event name and operation scope. It emits:

- `visitor_started`
- `signup_completed` (adapter-ready; emit after the auth flow succeeds)
- `generation_started`
- `generation_completed`
- `generation_failed`
- `share_created`
- `share_viewed`

Fixture mode writes a capped local development log under `ai-gtm:analytics-log`. A Convex adapter should send the same safe payload to Plan A. Event properties contain operation IDs, result IDs, error codes, and mode only—never source text, outreach, credentials, or personal data.

## Sample scenarios

`apps/web/lib/sample-scenarios.ts` contains strong, moderate, funding-only, irrelevant, and multi-signal input examples. Expected bands are QA annotations only. The UI never hard-codes scores. The strong scenario is loadable in one click.

## Dodo Payments

The pricing route is safe by default: checkout stays disabled unless `NEXT_PUBLIC_REVENUE_ENABLED=true`. Even when enabled, the client first checks backend entitlement and then requests a server-created checkout URL. Success/cancel URL parameters never unlock access; only Convex entitlement may do that.

## Tests and quality gates

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Tests cover input preservation and validation, fixture generation, explainable score rendering, error mapping, anonymous analytics deduplication, share-token creation, public/revenue gates, and sample coverage.

## Cloudflare Workers

The web app uses `@opennextjs/cloudflare`, Wrangler, Node compatibility flags, and immutable caching for Next.js static assets.

```bash
pnpm --filter @ai-gtm/web preview   # production-style local Worker preview
pnpm --filter @ai-gtm/web deploy    # build and deploy
pnpm --filter @ai-gtm/web upload    # upload a version without deploying it
pnpm --filter @ai-gtm/web cf-typegen
```

Set `NEXT_PUBLIC_CONVEX_URL` in the Cloudflare build environment. Keep model, LinkUp, and Dodo secrets in Convex. After deployment, verify `/analyze`, `/results/fixture-strong`, `/share/demo-fixture-strong`, and `/pricing`, then test the real Convex/share/payment return URLs when Plan A is connected.

## Troubleshooting

- **Fixture mode appears unexpectedly:** ensure `NEXT_PUBLIC_CONVEX_URL` is present at build time and the Plan A adapter has replaced the fixture client.
- **LinkUp option fails:** paste source text or disable research; LinkUp is optional and server-side.
- **Checkout is disabled:** set `NEXT_PUBLIC_REVENUE_ENABLED=true` only after the Dodo server action, webhook, and entitlement query are configured.
- **Cloudflare preview fails:** run `pnpm install`, confirm Node 20.19+, then run `pnpm --filter @ai-gtm/web preview` from the repository root.
- **A share is missing:** fixture mode supports only `demo-fixture-strong`; production shares require Plan A's stored token query.
