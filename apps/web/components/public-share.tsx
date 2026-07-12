"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AgentResult } from "@ai-gtm/contracts";
import { OpportunityDashboard } from "./opportunity-dashboard";
import { getProductClient, type ProductClient } from "../lib/product-client";

export function PublicShare({ result, client }: { result: AgentResult; client?: ProductClient }) {
  const productClient = useMemo(() => client ?? getProductClient(), [client]);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void productClient.trackEvent("share_viewed", { scope: result.id, resultId: result.id });
  }, [productClient, result.id]);

  return <OpportunityDashboard result={result} readOnly />;
}
