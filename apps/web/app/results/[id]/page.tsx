import { SavedResult } from "../../../components/saved-result";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <header className="page-header product-shell">
        <a className="brand" href="/">
          AI GTM OS
        </a>
        <a href="/analyze">New analysis</a>
      </header>
      <SavedResult id={id} />
    </>
  );
}
