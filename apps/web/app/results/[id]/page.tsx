import { notFound } from "next/navigation";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { OpportunityDashboard } from "../../../components/opportunity-dashboard";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== strongOpportunityFixture.id) notFound();
  return (
    <main className="product-shell">
      <header className="page-header">
        <a className="brand" href="/">AI GTM OS</a>
        <a href="/analyze">New analysis</a>
      </header>
      <OpportunityDashboard result={strongOpportunityFixture} />
    </main>
  );
}
