"use client";

import { type ReactNode, useMemo } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

export function Providers({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url && /^https:\/\//.test(url) ? new ConvexReactClient(url) : null;
  }, []);

  return convex ? <ConvexProvider client={convex}>{children}</ConvexProvider> : children;
}
