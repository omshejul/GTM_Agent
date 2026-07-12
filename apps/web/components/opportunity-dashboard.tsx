import type { AgentResult } from "@ai-gtm/contracts";
import { EvidenceList } from "./evidence-list";
import { OutreachCard } from "./outreach-card";
import { ShareDialog } from "./share-dialog";
import { ScoreCard, labelSignal } from "./score-card";
import type { ProductClient } from "../lib/product-client";

export function OpportunityDashboard({
  result,
  readOnly = false,
  client,
}: {
  result: AgentResult;
  readOnly?: boolean;
  client?: ProductClient;
}) {
  return (
    <section className="dashboard" aria-label="Opportunity analysis result">
      <div className="result-heading">
        <div>
          <p className="eyebrow">Analysis complete</p>
          <h1>{result.companyName ?? "Unidentified company"}</h1>
          <p>{[result.eventType, result.location, result.eventDate].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="result-actions">
          <div className="signal-pills">
            {result.signals.map((signal) => <span className="badge" key={signal}>{labelSignal(signal)}</span>)}
          </div>
          {!readOnly ? (
            <>
              <a
                className="button button-secondary"
                href={`/results/${result.id}`}
              >
                Open saved result
              </a>
              <ShareDialog result={result} client={client} />
            </>
          ) : (
            <span className="badge badge-muted">Read-only shared brief</span>
          )}
        </div>
      </div>

      <div className="dashboard-grid">
        <ScoreCard result={result} />
        <article className="panel recommendation-card">
          <p className="eyebrow">Recommended solution</p>
          <h2>{result.recommendedSolution}</h2>
          <p>{result.reasoning}</p>
          <dl>
            <div><dt>Best contact</dt><dd>{result.recommendedContactRole}</dd></div>
            <div><dt>Next action</dt><dd>{result.nextAction}</dd></div>
          </dl>
        </article>
      </div>

      <EvidenceList result={result} />
      {!readOnly ? <OutreachCard result={result} /> : null}
    </section>
  );
}
