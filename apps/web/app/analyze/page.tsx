import { AnalyzeExperience } from "../../components/analyze-experience";

export default function AnalyzePage() {
  return (
    <main className="product-shell">
      <header className="page-header">
        <a className="brand" href="/">AI GTM OS</a>
        <nav aria-label="Primary navigation">
          <a href="/pricing">Pricing</a>
          <span className="status" title="This build uses the typed Plan A fixture"><i /> Demo data</span>
        </nav>
      </header>
      <section className="analyze-hero">
        <p className="eyebrow">Warehouse expansion intelligence</p>
        <h1>Is this account in-market right now?</h1>
        <p>Ground the answer in observable evidence, a deterministic score, and an outreach draft your team controls.</p>
      </section>
      <AnalyzeExperience />
    </main>
  );
}
