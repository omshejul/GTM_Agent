"use client";

import { useEffect, useState } from "react";
import type { AgentResult } from "@ai-gtm/contracts";
import { OpportunityDashboard } from "./opportunity-dashboard";
import { getProductClient, type ProductClient } from "../lib/product-client";

export function SavedResult({
  id,
  client = getProductClient(),
}: {
  id: string;
  client?: ProductClient;
}) {
  const [result, setResult] = useState<AgentResult | null>();

  useEffect(() => {
    let active = true;
    const request = client.getGeneration
      ? client.getGeneration(id)
      : Promise.resolve(null);
    request
      .then((value) => {
        if (active) setResult(value);
      })
      .catch(() => {
        if (active) setResult(null);
      });
    return () => {
      active = false;
    };
  }, [client, id]);

  if (result === undefined) {
    return <main className="shell page-section">Loading saved analysis…</main>;
  }
  if (!result) {
    return (
      <main className="shell page-section">
        <h1>Saved analysis not found</h1>
        <p>This result does not exist or is not available to this browser.</p>
      </main>
    );
  }
  return (
    <main className="shell page-section">
      <OpportunityDashboard result={result} client={client} />
    </main>
  );
}
