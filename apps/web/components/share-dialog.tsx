"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { AgentResult } from "@ai-gtm/contracts";
import { getProductClient, type ProductClient } from "../lib/product-client";

export function ShareDialog({ result, client }: { result: AgentResult; client?: ProductClient }) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function createLink() {
    setLoading(true);
    setFeedback("");
    try {
      const { token } = await productClient.createShare(result.id);
      setUrl(`${window.location.origin}/share/${token}`);
      await productClient.trackEvent("share_created", {
        scope: result.id,
        resultId: result.id,
        mode: productClient.mode,
      });
    } catch {
      setFeedback("The share link could not be created. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Link copied.");
    } catch {
      setFeedback("Select and copy the link below.");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button button-secondary" type="button">Share result</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-backdrop" />
        <Dialog.Content className="dialog" aria-describedby="share-description">
          <Dialog.Close asChild>
            <button className="dialog-close" type="button" aria-label="Close share dialog">×</button>
          </Dialog.Close>
          <p className="eyebrow">Public sharing</p>
          <Dialog.Title asChild>
            <h2>Create a read-only opportunity brief.</h2>
          </Dialog.Title>
          <Dialog.Description id="share-description">
            Only backend-approved result fields are shown. Source inputs, private analytics, and draft outreach are not included.
          </Dialog.Description>
          {url ? (
            <>
              <label className="field">
                <span>Share URL</span>
                <input value={url} readOnly onFocus={(event) => event.currentTarget.select()} />
              </label>
              <button className="button" type="button" onClick={copyLink}>Copy link</button>
            </>
          ) : (
            <button className="button" type="button" disabled={loading} onClick={createLink}>
              {loading ? "Creating…" : "Create read-only link"}
            </button>
          )}
          {feedback ? <p className="dialog-feedback" role="status">{feedback}</p> : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
