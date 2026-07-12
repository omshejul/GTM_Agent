"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AgentResult, LeadRoast } from "@ai-gtm/contracts";
import { OpportunityDashboard } from "./opportunity-dashboard";
import { getProductClient, type ProductClient } from "../lib/product-client";

export function PublicShare({
  result,
  roast,
  client,
}: {
  result: AgentResult;
  roast?: LeadRoast | null;
  client?: ProductClient;
}) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void productClient
      .trackEvent("share_viewed", { scope: result.id, resultId: result.id })
      .catch(() => undefined);
  }, [productClient, result.id]);

  return (
    <>
      <OpportunityDashboard result={result} readOnly />
      {roast ? (
        <section className="panel roast-card" aria-label="Lead roast snapshot">
          <p className="eyebrow">Lead roast snapshot</p>
          <h2>{roast.headline}</h2>
          <p>{roast.oneLineRoast}</p>
          <dl>
            <div>
              <dt>Diagnosis</dt>
              <dd>{roast.diagnosis}</dd>
            </div>
            <div>
              <dt>Recommended treatment</dt>
              <dd>{roast.recommendedTreatment}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </>
  );
}
