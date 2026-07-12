type DiagnosticLevel = "info" | "warn" | "error";
type DiagnosticValue = string | number | boolean | null | undefined;
type DiagnosticSink = Pick<Console, DiagnosticLevel>;

const sensitiveKey =
  /source|prompt|secret|token|password|content|article|outreach/i;

export function diagnosticErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { errorName: typeof error };
  const record = error as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : {};
  const message = error instanceof Error ? error.message : "";
  const requestId = message.match(/\[Request ID: ([^\]]+)\]/)?.[1];
  return {
    errorName:
      error instanceof Error ? error.name : String(record.name ?? "unknown"),
    ...(data.code ? { errorCode: String(data.code) } : {}),
    ...(requestId ? { requestId } : {}),
    ...(typeof data.recoverable === "boolean"
      ? { recoverable: data.recoverable }
      : {}),
  };
}

function safeDetails(details: Record<string, DiagnosticValue>) {
  return Object.fromEntries(
    Object.entries(details)
      .filter(
        ([key, value]) =>
          (key.startsWith("has") || !sensitiveKey.test(key)) &&
          value !== undefined,
      )
      .map(([key, value]) => [
        key,
        typeof value === "string" ? value.slice(0, 300) : value,
      ]),
  );
}

export function logDiagnostic(
  level: DiagnosticLevel,
  event: string,
  details: Record<string, DiagnosticValue> = {},
  sink: DiagnosticSink = console,
) {
  sink[level](`[AI_GTM] ${event}`, {
    timestamp: new Date().toISOString(),
    ...safeDetails(details),
  });
}
