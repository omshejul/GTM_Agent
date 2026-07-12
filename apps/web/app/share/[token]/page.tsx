import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { strongOpportunityFixture } from "@ai-gtm/contracts";
import { PublicShare } from "../../../components/public-share";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  if (token !== `demo-${strongOpportunityFixture.id}`) return { title: "Shared opportunity not found" };
  return {
    title: `${strongOpportunityFixture.companyName} opportunity brief · AI GTM OS`,
    description: `Evidence-backed intent score: ${strongOpportunityFixture.intentScore}/100`,
    robots: { index: false, follow: false },
  };
}

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token !== `demo-${strongOpportunityFixture.id}`) notFound();
  return (
    <main className="product-shell">
      <header className="page-header">
        <a className="brand" href="/">AI GTM OS</a>
        <span className="status"><i /> Public read-only view</span>
      </header>
      <PublicShare result={strongOpportunityFixture} />
    </main>
  );
}
