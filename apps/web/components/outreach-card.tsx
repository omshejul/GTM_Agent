"use client";

import { useState } from "react";
import type { AgentResult } from "@ai-gtm/contracts";

export function OutreachCard({ result }: { result: AgentResult }) {
  const [copied, setCopied] = useState<"linkedin" | "email" | null>(null);

  async function copy(kind: "linkedin" | "email", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
  }
  return (
    <section className="panel dashboard-section">
      <p className="eyebrow">Human-reviewed outreach</p>
      <h2>Use the evidence, then add judgment.</h2>
      <div className="review-notice">
        Draft only — review and approve before sending. AI GTM OS never sends
        automatically.
      </div>
      <div className="outreach-grid">
        <article>
          <span>LinkedIn message</span>
          <p>{result.linkedinMessage}</p>
          <button
            className="text-button"
            type="button"
            onClick={() => void copy("linkedin", result.linkedinMessage)}
          >
            {copied === "linkedin" ? "Copied" : "Copy LinkedIn draft"}
          </button>
        </article>
        <article>
          <span>Email opener</span>
          <p>{result.emailOpener}</p>
          <button
            className="text-button"
            type="button"
            onClick={() => void copy("email", result.emailOpener)}
          >
            {copied === "email" ? "Copied" : "Copy email opener"}
          </button>
        </article>
      </div>
    </section>
  );
}
