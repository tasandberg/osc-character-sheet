// Pure PII scrubber for outgoing crash-report events (Sentry `beforeSend`).
// Kept SDK-type-free so it can be unit-tested without @sentry/browser.

/** Structural subset of a Sentry error event that we touch. */
export interface ScrubbableEvent {
  message?: string;
  breadcrumbs?: unknown;
  user?: unknown;
  request?: unknown;
  server_name?: string;
  extra?: Record<string, unknown>;
  exception?: { values?: Array<{ type?: string; value?: string }> };
}

/** Foundry document ids are 16 alnum chars; also match dotted UUIDs (Actor.xxxx…). */
const FOUNDRY_ID = /\b(?:[A-Za-z]+\.)?[a-zA-Z0-9]{16}\b/g;

const REDACTED = "[redacted]";

/** Redact Foundry ids and the given names from a text blob. */
export function redactText(text: string, names: readonly string[]): string {
  let out = text.replace(FOUNDRY_ID, REDACTED);
  for (const name of names) {
    if (!name || name.length < 2) continue;
    out = out.split(name).join(REDACTED);
  }
  return out;
}

/**
 * Strip PII from an event in place: drop breadcrumbs/user/request/server_name
 * outright, and redact Foundry ids plus the given names (actor/user names)
 * from the message and every exception value. Returns the same event.
 */
export function scrubEvent<T extends ScrubbableEvent>(
  event: T,
  names: readonly string[],
): T {
  delete event.breadcrumbs;
  delete event.user;
  delete event.request;
  delete event.server_name;
  if (typeof event.message === "string") {
    event.message = redactText(event.message, names);
  }
  for (const v of event.exception?.values ?? []) {
    if (typeof v.value === "string") v.value = redactText(v.value, names);
  }
  const stack = event.extra?.componentStack;
  if (typeof stack === "string") {
    event.extra!.componentStack = redactText(stack, names);
  }
  return event;
}
