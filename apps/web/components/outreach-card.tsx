import type { AgentResult } from "@ai-gtm/contracts";

export function OutreachCard({ result }: { result: AgentResult }) {
  return (
    <section className="panel dashboard-section">
      <p className="eyebrow">Human-reviewed outreach</p>
      <h2>Use the evidence, then add judgment.</h2>
      <div className="review-notice">
        Draft only — review and approve before sending. AI GTM OS never sends automatically.
      </div>
      <div className="outreach-grid">
        <article>
          <span>LinkedIn message</span>
          <p>{result.linkedinMessage}</p>
        </article>
        <article>
          <span>Email opener</span>
          <p>{result.emailOpener}</p>
        </article>
      </div>
    </section>
  );
}
