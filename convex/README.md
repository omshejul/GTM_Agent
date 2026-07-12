# Convex backend

This workspace contains the Convex application backend: schema, opportunity generation, analytics, research, sharing, and feature-gated payments. The `ai.ts` adapter calls an OpenAI-compatible API directly.

Import shared types and deterministic scoring from `@ai-gtm/contracts`; do not duplicate them here. Run `pnpm --filter @ai-gtm/backend exec convex dev` after creating a Convex deployment. This replaces the checked-in generated-compatible bootstrap under `_generated/` with deployment-specific generated types.

Public functions used by the product are:

- `api.opportunities.generateOpportunity`
- `api.generations.getGeneration`
- `api.opportunities.getOpportunity` and `listMyOpportunities`
- `api.analytics.createVisitor` (call once before anonymous private operations)
- `api.analytics.trackEvent`
- `api.shares.createShare`, `getSharedResult`, and `revokeShare`
- `api.payments.createCheckout` and `getEntitlement`

Dodo sends signed subscription events to `POST /webhooks/dodo`. LinkUp and payments remain optional; pasted-text generation needs only `OPENAI_API_KEY` and `OPENAI_MODEL`.
