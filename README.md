# AI GTM OS

Monorepo for the Warehouse Expansion Intelligence agent described by the three planning documents in this repository.

## Layout

- `apps/web` — Next.js product experience (Plan B)
- `packages/contracts` — shared API types, controlled vocabulary, fixtures, and scoring (the Plan A/Plan B boundary)
- `convex` — persistence, orchestration, research, analytics, sharing, and payments (Plan A)
- `prompts` — evidence-grounded model prompts

## Start

```bash
corepack enable
pnpm install
cp .env.example apps/web/.env.local
pnpm dev
```

Run `pnpm test`, `pnpm typecheck`, and `pnpm build` before merging. Secrets belong in Convex environment variables. The intelligence layer calls an OpenAI-compatible API directly; Hermes is not a runtime dependency. Payment and LinkUp features remain optional and must not block pasted-text analysis.

Required runtime configuration:

- `NEXT_PUBLIC_CONVEX_URL` in `apps/web/.env.local`
- `OPENAI_API_KEY` and `OPENAI_MODEL` in the Convex deployment

`OPENAI_BASE_URL` is only needed for a non-OpenAI compatible provider. `LINKUP_API_KEY`, `DODO_PAYMENTS_API_KEY`, and `DODO_WEBHOOK_SECRET` enable optional features.

## Contract

The frontend depends only on `@ai-gtm/contracts`. The backend owns research, extraction, deterministic scoring, persistence, authorization, and payment verification. Unknown extracted facts are `null`, source claims require citations, and outreach is always a human-reviewed draft.
