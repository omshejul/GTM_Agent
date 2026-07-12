# Convex backend

This directory is intentionally outside the package glob because Convex generates and deploys it as an application backend. Implement the backend as `schema.ts`, `opportunities.ts`, `generations.ts`, `analytics.ts`, `research.ts`, `ai.ts`, `scoring.ts`, `payments.ts`, and `http.ts`. The `ai.ts` adapter calls an OpenAI-compatible API directly; Hermes is not part of the deployed product.

Import shared types and deterministic scoring from `@ai-gtm/contracts`; do not duplicate them here. Run `pnpm dlx convex dev` from the repository root after creating a Convex deployment.
