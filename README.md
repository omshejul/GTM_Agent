# AI GTM OS

AI GTM OS turns warehouse-expansion evidence into an explainable deterministic intent score, a recommended solution, and human-reviewed outreach. Production runs as a self-hosted Next.js application with a self-hosted Convex backend.

## Architecture

```text
apps/web                  Next.js App Router product
  app/analyze             input, loading, failure, and live result flow
  app/results/[id]        private saved-generation route
  app/share/[token]       immutable public snapshot route and metadata
  app/pricing             fail-closed Dodo checkout UI
  lib/product-client.ts   browser-to-Convex integration boundary
convex                    schema, generation, research, AI, sharing, analytics, payments
packages/contracts        runtime contracts and deterministic scoring
```

The browser never receives provider credentials, researches companies directly, calculates scores, validates payment webhooks, or grants entitlements. Anonymous private operations use a server-issued visitor credential stored in browser storage. Public shares contain immutable reduced snapshots and are addressed by random bearer tokens whose hashes are stored server-side.

## Routes

- `/` — product landing page
- `/analyze` — source and LinkUp research form with live opportunity results
- `/results/[id]` — saved result for the browser that created it
- `/share/[token]` — public read-only result and optional roast snapshot
- `/pricing` — free analysis and feature-gated Dodo checkout
- `/dodo` — Dodo webhook; unsigned requests fail closed

The analysis form uses controlled seller-solution, industry, and India state/region inputs. Users can load a safe example in one click. The core flow requires pasted source text; a source URL or company-only request requires LinkUp research. Recoverable failures preserve every field. Results include copyable human-reviewed outreach, JSON export, and an optional evidence-grounded workplace-safe lead roast. Outreach is never sent automatically.

## Local setup

Requirements: Node 20.19+ and pnpm 10.12+.

```bash
corepack enable
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

### Browser-safe environment variables

- `NEXT_PUBLIC_CONVEX_URL` — required live Convex URL
- `NEXT_PUBLIC_REVENUE_ENABLED` — enables checkout UI only when explicitly `true`
- `NEXT_PUBLIC_DODO_CHECKOUT_HOST` — exact trusted checkout hostname
- `NEXT_PUBLIC_DODO_PRODUCT_ID` — browser-safe allowlisted Dodo product identifier

### Server-side Convex environment variables

Never prefix these with `NEXT_PUBLIC_`:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL` — optional OpenAI-compatible endpoint
- `LINKUP_API_KEY` — required only for LinkUp-enabled research
- `DODO_PAYMENTS_API_KEY`
- `DODO_WEBHOOK_SECRET`
- `DODO_PRODUCT_IDS` — comma-separated checkout allowlist
- `APP_ORIGIN` — trusted payment return origin
- `DODO_PAYMENTS_ENABLED` — explicit payment feature switch

Configure secrets in the Convex deployment environment, not browser files.

## Live Convex contracts

The frontend uses:

- action `analytics:createVisitor`
- mutation `analytics:trackEvent`
- action `opportunities:generateOpportunity`
- query `generations:getGeneration`
- action `shares:createShare`
- action `shares:getSharedResult`
- action `payments:createCheckout`
- query `payments:getEntitlement`

Generation, analytics, saved-result retrieval, and share creation reuse the server-issued visitor credential. Checkout consumes `{ checkoutUrl, checkoutId }`; entitlement consumes `{ tier, entitled, status }`. Payment return parameters never unlock access.

## Analytics and diagnostics

Analytics uses controlled event names and privacy-safe properties. Diagnostics share a correlation ID across browser and Convex logs. Logs contain request shape, stages, counts, duration, provider status, repair attempts, and stable error codes—not source text, prompts, credentials, outreach, or private URLs.

## Testing

```bash
pnpm test
pnpm typecheck
pnpm --filter @ai-gtm/backend lint
pnpm --filter @ai-gtm/contracts lint
pnpm build
```

Tests cover deterministic scoring, runtime validation, AI grounding and repair, anonymous visitor ownership, persisted generations, public share snapshots and revocation, analytics, Dodo webhook processing, checkout guards, UI failure recovery, and contract adapters.

The fixture boundary remains intentionally usable without a backend: analysis returns the typed demo result, saved-result and public-share routes resolve, JSON export works, and the roast generator stays deterministic and evidence-grounded.

## Production deployment

Production is self-hosted:

- Next.js: `127.0.0.1:3010`
- Convex API: `127.0.0.1:3210`
- Convex HTTP actions: `127.0.0.1:3211`
- Caddy: public HTTPS routing for `gtmagent.omshejul.com`
- systemd user services: `gtm-web.service`, `gtm-convex.service`

A release is complete only after tests, typecheck, production build, Convex deployment, service restart, and public end-to-end verification succeed.

## Troubleshooting

- LinkUp failure: retry with pasted source text or disable company research; the key is server-side.
- Saved result not found: use the same browser that created it; ownership uses its server-issued visitor credential.
- Share not found: the token may be invalid, expired, or revoked.
- Checkout disabled: verify all payment environment variables, authenticated identity, product allowlist, trusted origin, and explicit feature switches.
- AI output rejected: use the correlation ID in browser and Convex logs to inspect grounding or schema validation failures.
