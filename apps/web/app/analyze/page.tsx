import { strongOpportunityFixture } from "@ai-gtm/contracts";
export default function Analyze() {
  const result = strongOpportunityFixture;
  return <main><p className="eyebrow">DEMO FIXTURE · BACKEND CONTRACT READY</p><h1>{result.companyName}</h1><section className="grid"><article><span>Intent score</span><strong>{result.intentScore}</strong><p>{result.intentBand.replaceAll("_", " ")}</p></article><article><span>Recommended solution</span><h2>{result.recommendedSolution}</h2><p>{result.reasoning}</p></article></section><h2>Verified evidence</h2>{result.evidence.map((item) => <blockquote key={item.text}>{item.text}</blockquote>)}<h2>Draft outreach</h2><p>{result.linkedinMessage}</p><small>Review and approve before sending. This product never sends automatically.</small></main>;
}
