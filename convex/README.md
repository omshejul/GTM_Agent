# Convex backend

This directory is intentionally outside the package glob because Convex generates and deploys it as an application backend. Implement modules according to Plan A: `schema.ts`, `opportunities.ts`, `generations.ts`, `analytics.ts`, `research.ts`, `hermes.ts`, `scoring.ts`, `payments.ts`, and `http.ts`.

Import shared types and deterministic scoring from `@ai-gtm/contracts`; do not duplicate them here. Run `pnpm dlx convex dev` from the repository root after creating a Convex deployment.
