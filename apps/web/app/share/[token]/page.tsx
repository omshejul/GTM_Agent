import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShare } from "../../../components/public-share";
import {
  fetchSharedResult,
  metadataForSharedResult,
} from "../../../lib/shared-result";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const snapshot = await fetchSharedResult(token).catch(() => null);
  return snapshot
    ? metadataForSharedResult(snapshot.result)
    : { title: "Shared opportunity not found", robots: { index: false } };
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await fetchSharedResult(token).catch(() => null);
  if (!snapshot) notFound();
  return (
    <main className="product-shell">
      <header className="page-header">
        <a className="brand" href="/">
          AI GTM OS
        </a>
        <span className="status">
          <i /> Public read-only view
        </span>
      </header>
      <PublicShare result={snapshot.result} roast={snapshot.roast} />
    </main>
  );
}
