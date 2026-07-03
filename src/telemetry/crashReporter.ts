// Opt-in crash reporting (Sentry protocol, manual client — NEVER Sentry.init,
// which would patch window.onerror/fetch globally and capture other modules'
// errors). The only capture point is our React ErrorBoundary (`reportError`).
//
// Consent gates everything: the world setting must be on AND a DSN must have
// been baked in at build time (`VITE_SENTRY_DSN`). Until both hold, the Sentry
// chunk is never even loaded — `import("@sentry/browser")` is dynamic, so vite
// code-splits it and non-consenting worlds pay 0 KB and make zero requests.
// All failure paths (offline, bad DSN, SDK load error) are silent by design.

import { MODULE_ID } from "@domain/flags";
import { scrubEvent, type ScrubbableEvent } from "./scrub";

export const CRASH_REPORTING_SETTING = "crashReporting";

const DSN: string = import.meta.env.VITE_SENTRY_DSN ?? "";

/** Client-side flood guard: never send more than this many events per session. */
const MAX_EVENTS_PER_SESSION = 5;
let eventsSent = 0;

interface ReporterScope {
  setTag(key: string, value: string): void;
  captureException(error: unknown, hint?: { captureContext?: { extra?: Record<string, unknown> } }): unknown;
}
let scopePromise: Promise<ReporterScope | null> | null = null;

/** True when the GM has opted in AND the build carries a DSN. */
export function crashReportingEnabled(): boolean {
  if (!DSN) return false;
  try {
    const settings = game.settings as { get(ns: string, key: string): unknown };
    return !!settings.get(MODULE_ID, CRASH_REPORTING_SETTING);
  } catch {
    return false; // settings unavailable (storybook/tests/early boot)
  }
}

/** Names that must never leave the client: every user and actor name in the world. */
function collectRedactions(): string[] {
  const names: string[] = [];
  try {
    const g = game as unknown as {
      users?: Iterable<{ name?: string | null }>;
      actors?: Iterable<{ name?: string | null }>;
    };
    for (const u of g.users ?? []) if (u.name) names.push(u.name);
    for (const a of g.actors ?? []) if (a.name) names.push(a.name);
  } catch {
    /* redaction list is best-effort */
  }
  return names;
}

function moduleVersion(): string {
  try {
    const mod = game.modules?.get(MODULE_ID) as { version?: string } | undefined;
    return mod?.version ?? "unknown";
  } catch {
    return "unknown";
  }
}

async function loadScope(): Promise<ReporterScope | null> {
  try {
    const Sentry = await import("./sentryClient");
    const version = moduleVersion();
    const redact = collectRedactions();
    const client = new Sentry.BrowserClient({
      dsn: DSN,
      transport: Sentry.makeFetchTransport,
      stackParser: Sentry.defaultStackParser,
      // Explicitly minimal: no default integrations (they patch globals).
      // Dedupe is event-processing only — safe, and stops repeat-crash spam.
      integrations: [Sentry.dedupeIntegration()],
      release: `${MODULE_ID}@${version}`,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      beforeSend: (event) => scrubEvent(event as ScrubbableEvent, redact) as typeof event,
    });
    const scope = new Sentry.Scope();
    scope.setClient(client);
    client.init(); // installs the (explicit) integrations on this client only
    scope.setTag("module_version", version);
    try {
      scope.setTag("foundry_build", String(game.version ?? "unknown"));
      scope.setTag("ose_version", String(game.system?.version ?? "unknown"));
    } catch {
      /* tags are best-effort */
    }
    return scope;
  } catch {
    return null; // SDK failed to load — reporting silently off
  }
}

/**
 * Report an error caught by our ErrorBoundary (or an explicit catch of ours).
 * No-op unless consent + DSN + session cap allow it. Never throws.
 */
export function reportError(
  error: unknown,
  context: { actorKind?: string; componentStack?: string } = {},
): void {
  try {
    if (!crashReportingEnabled()) return;
    if (eventsSent >= MAX_EVENTS_PER_SESSION) return;
    eventsSent++;
    scopePromise ??= loadScope();
    scopePromise
      .then((scope) => {
        if (!scope) return;
        if (context.actorKind) scope.setTag("actor_kind", context.actorKind);
        scope.captureException(error, {
          captureContext: context.componentStack
            ? { extra: { componentStack: context.componentStack } }
            : undefined,
        });
      })
      .catch(() => {
        /* silent — offline/air-gapped installs must not spam the console */
      });
  } catch {
    /* the reporter must never take down the caller */
  }
}
