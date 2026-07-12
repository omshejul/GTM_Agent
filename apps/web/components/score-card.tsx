import type { AgentResult } from "@ai-gtm/contracts";

const signalLabels: Record<string, string> = {
  new_warehouse: "New warehouse",
  warehouse_lease: "Warehouse lease",
  automation_investment: "Automation investment",
  leadership_hiring: "Leadership hiring",
  regional_expansion: "Regional expansion",
  growth_funding: "Growth funding",
  recent_event: "Recent event",
  weak_evidence: "Weak evidence",
};

export function labelSignal(signal: string) {
  return signalLabels[signal] ?? signal.replaceAll("_", " ");
}

export function ScoreCard({ result }: { result: AgentResult }) {
  return (
    <article className="panel score-card">
      <p className="eyebrow">Intent score</p>
      <div className="score-row">
        <strong className="score-value">{result.intentScore}</strong>
        <span>/ 100</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Intent score"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={result.intentScore}
      >
        <span style={{ width: `${result.intentScore}%` }} />
      </div>
      <p className="band">{result.intentBand.replaceAll("_", " ")}</p>
      <p className="confidence">{Math.round(result.confidence * 100)}% extraction confidence</p>
      <h3>Score breakdown</h3>
      <ul className="score-breakdown">
        {result.scoreBreakdown.map((line) => (
          <li key={line.signal}>
            <span>{labelSignal(line.signal)}</span>
            <strong>{line.points > 0 ? "+" : ""}{line.points}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}
