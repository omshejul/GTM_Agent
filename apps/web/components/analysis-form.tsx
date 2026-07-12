"use client";

import { useState, type FormEvent } from "react";
import type { GenerateOpportunityInput } from "@ai-gtm/contracts";
import { primarySample } from "../lib/sample-scenarios";

const emptyForm: GenerateOpportunityInput = {
  sellerSolution: "",
  targetIndustry: "",
  targetRegion: "",
  companyName: "",
  sourceUrl: "",
  sourceText: "",
  researchWithLinkUp: false,
};

interface AnalysisFormProps {
  onGenerate: (input: GenerateOpportunityInput) => void;
  isLoading?: boolean;
}

export function AnalysisForm({ onGenerate, isLoading = false }: AnalysisFormProps) {
  const [form, setForm] = useState<GenerateOpportunityInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof GenerateOpportunityInput>(
    key: K,
    value: GenerateOpportunityInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hasDirectSource = Boolean(form.sourceText?.trim() || form.sourceUrl?.trim());
    const canResearchCompany = Boolean(
      form.researchWithLinkUp && form.companyName?.trim(),
    );

    if (!form.sellerSolution.trim()) {
      setError("Describe the solution you sell before analyzing an opportunity.");
      return;
    }
    if (!hasDirectSource && !canResearchCompany) {
      setError(
        "Add source text, a source URL, or enable company research with a company name.",
      );
      return;
    }

    setError(null);
    onGenerate(form);
  }

  return (
    <form className="analysis-form" onSubmit={submit}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Opportunity input</p>
          <h2>Describe your market and the buying signal.</h2>
          <small>Use a company name with research enabled, or provide source text or a URL.</small>
        </div>
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setForm(primarySample.input);
            setError(null);
          }}
        >
          Load sample scenario
        </button>
      </div>

      <div className="form-grid">
        <label className="field field-wide">
          <span>Seller solution · required</span>
          <input
            aria-label="Seller solution"
            required
            value={form.sellerSolution}
            onChange={(event) => update("sellerSolution", event.target.value)}
            placeholder="e.g. Warehouse management and inventory visibility"
          />
        </label>
        <label className="field">
          <span>Target industry</span>
          <input
            value={form.targetIndustry ?? ""}
            onChange={(event) => update("targetIndustry", event.target.value)}
            placeholder="e.g. Retail"
          />
        </label>
        <label className="field">
          <span>Target region</span>
          <input
            value={form.targetRegion ?? ""}
            onChange={(event) => update("targetRegion", event.target.value)}
            placeholder="e.g. India"
          />
        </label>
        <label className="field">
          <span>Company name</span>
          <input
            value={form.companyName ?? ""}
            onChange={(event) => update("companyName", event.target.value)}
            placeholder="e.g. Example Retail Ltd"
          />
        </label>
        <label className="field">
          <span>Source URL</span>
          <input
            type="url"
            value={form.sourceUrl ?? ""}
            onChange={(event) => update("sourceUrl", event.target.value)}
            placeholder="https://…"
          />
        </label>
        <label className="field field-wide">
          <span>Source text</span>
          <textarea
            rows={6}
            value={form.sourceText ?? ""}
            onChange={(event) => update("sourceText", event.target.value)}
            placeholder="Paste an announcement, article, job post, or other evidence…"
          />
        </label>
      </div>

      <label className="research-toggle">
        <input
          type="checkbox"
          checked={form.researchWithLinkUp}
          onChange={(event) => update("researchWithLinkUp", event.target.checked)}
        />
        <span>
          <strong>Research this company with LinkUp</strong>
          <small>Research can take up to a minute and is available when your workspace has live research enabled.</small>
        </span>
      </label>

      {error ? <div className="alert" role="alert">{error}</div> : null}

      <div className="form-actions">
        <p>Analysis finds evidence-backed timing signals. It does not send outreach.</p>
        <button className="button" type="submit" disabled={isLoading}>
          {isLoading ? "Analyzing…" : "Analyze opportunity"}
        </button>
      </div>
    </form>
  );
}
