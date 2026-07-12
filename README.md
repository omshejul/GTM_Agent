# AI GTM OS

Monorepo for the Warehouse Expansion Intelligence agent described by the three planning documents in this repository.

## Layout

- `apps/web` — Next.js product experience (Plan B)
- `packages/contracts` — shared API types, controlled vocabulary, fixtures, and scoring (the Plan A/Plan B boundary)
- `convex` — persistence, orchestration, research, analytics, sharing, and payments (Plan A)
- `prompts` — evidence-grounded Hermes prompts

## Start

```bash
corepack enable
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merging. Secrets belong in Convex environment variables. Payment and LinkUp features remain optional and must not block pasted-text analysis.

## Contract

The frontend depends only on `@ai-gtm/contracts`. The backend owns research, extraction, deterministic scoring, persistence, authorization, and payment verification. Unknown extracted facts are `null`, source claims require citations, and outreach is always a human-reviewed draft.
