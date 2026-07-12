import type { AgentResult } from "@ai-gtm/contracts";
import { labelSignal } from "./score-card";

export function EvidenceList({ result }: { result: AgentResult }) {
  return (
    <section className="panel dashboard-section">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2>What supports this score</h2>
        </div>
        <span className="badge">{result.evidence.length} verified item{result.evidence.length === 1 ? "" : "s"}</span>
      </div>
      <div className="evidence-list">
        {result.evidence.map((item, index) => {
          const citation = item.citationIndex === null ? null : result.citations[item.citationIndex];
          return (
            <article className="evidence-item" key={`${item.signal}-${index}`}>
              <span className="badge badge-muted">{labelSignal(item.signal)}</span>
              <blockquote>{item.text}</blockquote>
              {citation ? (
                <a href={citation.url} target="_blank" rel="noreferrer">
                  {citation.title} ↗
                </a>
              ) : (
                <small>Provided source text</small>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
