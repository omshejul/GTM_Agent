"use client";

import { useMemo, useState } from "react";
import type { AgentResult, LeadRoast, LeadRoastTone } from "@ai-gtm/contracts";
import { getProductClient, type ProductClient } from "../lib/product-client";

export function ResultActions({
  result,
  client,
}: {
  result: AgentResult;
  client?: ProductClient;
}) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const [tone, setTone] = useState<LeadRoastTone>("professional_wit");
  const [roast, setRoast] = useState<LeadRoast | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function downloadJson() {
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(result.companyName ?? "opportunity").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function generateRoast() {
    setLoading(true);
    setError("");
    try {
      if (!productClient.generateLeadRoast)
        throw new Error("Roast unavailable");
      setRoast(await productClient.generateLeadRoast(result.id, tone));
    } catch {
      setError(
        "This lead could not be roasted safely. Try another completed result.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel result-tools" aria-label="Result tools">
      <div>
        <p className="eyebrow">Export</p>
        <h2>Take the brief with you.</h2>
        <button
          className="button button-secondary"
          type="button"
          onClick={downloadJson}
        >
          Download JSON
        </button>
      </div>
      <div>
        <p className="eyebrow">Roast this lead</p>
        <h2>Turn grounded signals into workplace-safe sales humor.</h2>
        <div className="button-row">
          <select
            aria-label="Lead roast tone"
            value={tone}
            onChange={(event) => setTone(event.target.value as LeadRoastTone)}
          >
            <option value="professional_wit">Professional wit</option>
            <option value="sales_team_spicy">Sales-team spicy</option>
            <option value="workplace_safe_unhinged">
              Workplace-safe unhinged
            </option>
          </select>
          <button
            className="button"
            type="button"
            disabled={loading}
            onClick={() => void generateRoast()}
          >
            {loading ? "Roasting…" : "Generate roast"}
          </button>
        </div>
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : null}
        {roast ? (
          <article className="roast-card" aria-label="Generated lead roast">
            <span>AI-generated · {roast.tone.replaceAll("_", " ")}</span>
            <h3>{roast.headline}</h3>
            <p>{roast.oneLineRoast}</p>
            <strong>Diagnosis: {roast.diagnosis}</strong>
            <small>Recommended treatment: {roast.recommendedTreatment}</small>
          </article>
        ) : null}
      </div>
    </section>
  );
}
