"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentResult, GenerateOpportunityInput } from "@ai-gtm/contracts";
import { AnalysisForm } from "./analysis-form";
import { OpportunityDashboard } from "./opportunity-dashboard";
import { friendlyAgentError, getAgentErrorCode } from "../lib/errors";
import { getProductClient, type ProductClient } from "../lib/product-client";
import { diagnosticErrorDetails, logDiagnostic } from "../lib/diagnostics";

async function trackSafely(
  client: ProductClient,
  event: Parameters<ProductClient["trackEvent"]>[0],
  properties: Parameters<ProductClient["trackEvent"]>[1],
) {
  try {
    await client.trackEvent(event, properties);
  } catch (cause) {
    logDiagnostic("warn", "analytics.failed", {
      event,
      ...diagnosticErrorDetails(cause),
    });
    // Analytics is best-effort and must never block the product flow.
  }
}

export function AnalyzeExperience({ client }: { client?: ProductClient }) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const trackedVisit = useRef(false);

  useEffect(() => {
    if (trackedVisit.current) return;
    trackedVisit.current = true;
    void trackSafely(productClient, "visitor_started", {
      scope: "product",
      mode: productClient.mode,
    });
  }, [productClient]);

  async function generate(input: GenerateOpportunityInput) {
    const scope =
      globalThis.crypto?.randomUUID?.() ?? `generation-${Date.now()}`;
    const startedAt = Date.now();
    const tracedInput = { ...input, idempotencyKey: scope };
    setError(null);
    setLoading(true);
    logDiagnostic("info", "generation.started", {
      scope,
      mode: productClient.mode,
      hasCompanyName: Boolean(input.companyName),
      hasSourceUrl: Boolean(input.sourceUrl),
      hasSourceText: Boolean(input.sourceText),
      researchEnabled: input.researchWithLinkUp,
      inputLength: input.sourceText?.length ?? 0,
    });
    await trackSafely(productClient, "generation_started", {
      scope,
      mode: productClient.mode,
    });
    try {
      const nextResult = await productClient.generateOpportunity(tracedInput);
      setResult(nextResult);
      logDiagnostic("info", "generation.completed", {
        scope,
        mode: productClient.mode,
        resultId: nextResult.id,
        durationMs: Date.now() - startedAt,
        signalCount: nextResult.signals.length,
        intentScore: nextResult.intentScore,
      });
      await trackSafely(productClient, "generation_completed", {
        scope,
        resultId: nextResult.id,
        mode: productClient.mode,
      });
      window.setTimeout(() => {
        const target = document.getElementById("analysis-result");
        if (typeof target?.scrollIntoView === "function") {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 0);
    } catch (cause) {
      const code = getAgentErrorCode(cause);
      logDiagnostic("error", "generation.failed", {
        scope,
        mode: productClient.mode,
        durationMs: Date.now() - startedAt,
        ...diagnosticErrorDetails(cause),
      });
      setError(friendlyAgentError(cause));
      await trackSafely(productClient, "generation_failed", {
        scope,
        code: code ?? "UNKNOWN",
        mode: productClient.mode,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {productClient.mode === "fixture" ? (
        <div className="demo-notice" role="note">
          <strong>Demo data:</strong> this mode returns a typed sample result
          and does not analyze custom input.
        </div>
      ) : null}
      <AnalysisForm onGenerate={generate} isLoading={loading} />
      {error ? (
        <div className="alert page-alert" role="alert">
          {error}
        </div>
      ) : null}
      <div id="analysis-result" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <section
            className="panel loading-state"
            aria-label="Analyzing opportunity"
          >
            <div className="skeleton skeleton-short" />
            <div className="skeleton" />
            <div className="skeleton" />
          </section>
        ) : result ? (
          <OpportunityDashboard result={result} client={productClient} />
        ) : (
          <section className="empty-state">
            <span>01</span>
            <h2>Your evidence-backed opportunity brief will appear here.</h2>
            <p>Paste source material or research a named company to begin.</p>
          </section>
        )}
      </div>
    </>
  );
}
