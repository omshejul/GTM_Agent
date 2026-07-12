export type AnalyticsEvent =
  | "visitor_started"
  | "signup_completed"
  | "generation_started"
  | "generation_completed"
  | "generation_failed"
  | "share_created"
  | "share_viewed";

export type SafeEventProperties = Record<string, string | number | boolean | null>;

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  visitorId: string;
  properties: SafeEventProperties;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface AnalyticsOptions {
  storage: KeyValueStorage;
  sink: (payload: AnalyticsPayload) => Promise<void>;
  createId?: () => string;
}

const visitorKey = "ai-gtm:visitor-id";
const eventPrefix = "ai-gtm:event:";

export function getOrCreateVisitorId(
  storage: KeyValueStorage,
  createId: () => string = () => crypto.randomUUID(),
): string {
  const existing = storage.getItem(visitorKey);
  if (existing) return existing;
  const id = createId();
  storage.setItem(visitorKey, id);
  return id;
}

export function createAnalyticsClient({ storage, sink, createId }: AnalyticsOptions) {
  const visitorId = getOrCreateVisitorId(storage, createId);
  return {
    async track(event: AnalyticsEvent, properties: SafeEventProperties = {}) {
      const scope = String(properties.scope ?? "global");
      const dedupeKey = `${eventPrefix}${event}:${scope}`;
      if (storage.getItem(dedupeKey)) return;
      storage.setItem(dedupeKey, "1");
      await sink({ event, visitorId, properties });
    },
  };
}
