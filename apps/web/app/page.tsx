import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <header className="page-header home-header">
        <span className="brand">AI GTM OS</span>
        <nav aria-label="Primary navigation"><Link href="/pricing">Pricing</Link></nav>
      </header>
      <section className="home-hero">
        <p className="eyebrow">Warehouse expansion intelligence</p>
        <h1>Find the buying window, not just the buyer.</h1>
        <p>Turn observable warehouse-expansion evidence into an explainable intent score, a recommended solution, and human-reviewed outreach.</p>
        <div className="hero-actions">
          <Link className="button" href="/analyze">Analyze an opportunity</Link>
          <Link className="button button-secondary" href="/share/demo-fixture-strong">View sample brief</Link>
        </div>
      </section>
      <section className="home-proof" aria-label="Product principles">
        <article><span>01</span><h2>Evidence first</h2><p>Every signal is tied to provided text or a clickable source citation.</p></article>
        <article><span>02</span><h2>Explainable score</h2><p>See every deterministic line item. The UI never changes the score.</p></article>
        <article><span>03</span><h2>Human controlled</h2><p>Outreach stays a draft. Nothing is sent without review and approval.</p></article>
      </section>
    </main>
  );
}
