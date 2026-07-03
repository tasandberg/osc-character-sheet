// Per-crash bug reporting (Sentry protocol, manual client — NEVER Sentry.init,
// which would patch window.onerror/fetch globally and capture other modules'
// errors). Nothing is ever sent automatically and there is no setting: the only
// sender is sendCrashReport(), invoked by the "Send bug report" button in the
// crash fallback.
//
// No-drift guarantee: buildCrashReport() produces the scrubbed payload, the
// fallback's "see what's included" disclosure renders that object verbatim,
// and sendCrashReport() takes it as its ONLY error input — the Sentry event is
// assembled purely from the report's fields, so what the user previews is what
// leaves the client.
//
// The Sentry chunk stays lazy: `import("./sentryClient")` lives inside
// sendCrashReport(), so vite code-splits it and the reporting code is never
// even downloaded unless the user presses Send. All failure paths (offline,
// bad DSN, SDK load error) resolve false so the UI can offer a retry.

import { MODULE_ID } from "@domain/flags";
import { redactText, scrubEvent, type ScrubbableEvent } from "./scrub";

const DSN: string = import.meta.env.VITE_SENTRY_DSN ?? "";

/** Flood guard: even a click-happy retry loop can't send more than this per session. */
const MAX_EVENTS_PER_SESSION = 5;
let eventsSent = 0;

/** True when this build carries a reporting endpoint (`VITE_SENTRY_DSN` at build time). */
export function hasDsn(): boolean {
  return !!DSN;
}

/** The complete crash-report payload — every field that leaves the client. */
export interface CrashReport {
  errorName: string;
  errorMessage: string;
  stack: string;
  componentStack?: string;
  moduleVersion: string;
  foundryVersion: string;
  oseVersion: string;
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

/** Build the scrubbed payload: actor/user names and Foundry ids are redacted here,
 *  client-side, before the report is ever shown or sent. */
export function buildCrashReport(
  error: Error,
  componentStack?: string,
): CrashReport {
  const names = collectRedactions();
  let foundryVersion = "unknown";
  let oseVersion = "unknown";
  try {
    foundryVersion = String(game.version ?? "unknown");
    oseVersion = String(game.system?.version ?? "unknown");
  } catch {
    /* versions are best-effort */
  }
  const report: CrashReport = {
    errorName: redactText(error.name, names),
    errorMessage: redactText(error.message, names),
    stack: redactText(error.stack ?? "(no stack)", names),
    moduleVersion: moduleVersion(),
    foundryVersion,
    oseVersion,
  };
  if (componentStack) report.componentStack = redactText(componentStack, names);
  return report;
}

/** Plain-text rendering of a report, for the clipboard / a GitHub issue. */
export function formatCrashReport(report: CrashReport): string {
  return [
    `${report.errorName}: ${report.errorMessage}`,
    report.stack,
    report.componentStack ? `Component stack:${report.componentStack}` : "",
    `Versions: ${MODULE_ID} ${report.moduleVersion}, Foundry ${report.foundryVersion}, OSE ${report.oseVersion}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Send a previously built (already scrubbed) report. Lazy-loads the Sentry
 * chunk on first call. Resolves true only when the transport confirmed
 * delivery — so the UI's sent/failed states are truthful. Never throws.
 */
export async function sendCrashReport(report: CrashReport): Promise<boolean> {
  if (!DSN) return false;
  if (eventsSent >= MAX_EVENTS_PER_SESSION) return false;
  try {
    const Sentry = await import("./sentryClient");
    let delivered = false;
    // Fresh client per attempt: no shared state, and a failed send can be
    // retried without dedupe-style suppression.
    const client = new Sentry.BrowserClient({
      dsn: DSN,
      // Wrap the fetch transport so delivery is observable (statusCode < 300);
      // the SDK's own flush() can't distinguish sent from dropped.
      transport: (options) => {
        const inner = Sentry.makeFetchTransport(options);
        return {
          send: (request) =>
            inner.send(request).then((res) => {
              if (res.statusCode === undefined || res.statusCode < 300) {
                delivered = true;
              }
              return res;
            }),
          flush: (timeout) => inner.flush(timeout),
        };
      },
      stackParser: Sentry.defaultStackParser,
      integrations: [], // nothing that patches globals
      release: `${MODULE_ID}@${report.moduleVersion}`,
      environment: import.meta.env.MODE,
      sendDefaultPii: false,
      // Defense in depth against SDK-added fields (server_name etc.) — the
      // event content itself comes from the already-scrubbed report.
      beforeSend: (event) => scrubEvent(event as ScrubbableEvent, []) as typeof event,
    });
    const scope = new Sentry.Scope();
    scope.setClient(client);
    client.init();
    scope.setTag("module_version", report.moduleVersion);
    scope.setTag("foundry_build", report.foundryVersion);
    scope.setTag("ose_version", report.oseVersion);
    // Event assembled from report fields only — see no-drift note up top.
    const frames = Sentry.defaultStackParser(report.stack);
    scope.captureEvent({
      exception: {
        values: [
          {
            type: report.errorName,
            value: report.errorMessage,
            ...(frames.length ? { stacktrace: { frames } } : {}),
          },
        ],
      },
      extra: {
        stack: report.stack,
        ...(report.componentStack
          ? { componentStack: report.componentStack }
          : {}),
      },
    });
    await client.flush(10_000);
    if (delivered) eventsSent++;
    return delivered;
  } catch {
    return false; // offline / SDK load error — UI offers retry or copy
  }
}
