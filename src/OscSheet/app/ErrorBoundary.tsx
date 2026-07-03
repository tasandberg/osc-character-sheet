// Error boundary at the sheet root: a render crash shows a vellum fallback
// instead of killing the Foundry client or leaving a dead window. Nothing is
// reported automatically — the fallback offers a per-crash "Send bug report"
// button (or copy-to-clipboard in builds without a reporting endpoint).

import {
  Component,
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@ui/Button";
import { SectionTitle } from "@ui/SectionTitle";
import { MODULE_ID } from "@domain/flags";
import type { OSEActor } from "@domain/types";
import {
  buildCrashReport,
  formatCrashReport,
  hasDsn,
  sendCrashReport,
} from "@src/telemetry/crashReporter";

const FALLBACK_REPO_URL = "https://github.com/tasandberg/osc-character-sheet";

function issuesUrl(): string {
  try {
    const mod = game.modules?.get(MODULE_ID) as { url?: string } | undefined;
    return `${mod?.url || FALLBACK_REPO_URL}/issues`;
  } catch {
    return `${FALLBACK_REPO_URL}/issues`;
  }
}

/** Unpin this actor's sheet (fall back to the system default, e.g. the OSE
 *  sheet) and reopen it. Foundry closes the crashed window itself when
 *  `flags.core.sheetClass` changes (ClientDocument#_onSheetChange). */
async function switchToDefaultSheet(actor: OSEActor): Promise<void> {
  const type = (actor as { type?: string }).type ?? "character";
  const cfg = (globalThis as Record<string, unknown>).CONFIG as
    | { Actor?: { sheetClasses?: Record<string, Record<string, unknown>> } }
    | undefined;
  const ids = Object.keys(cfg?.Actor?.sheetClasses?.[type] ?? {}).filter(
    (id) => !id.endsWith(".OscSheet"),
  );
  const target = ids.find((id) => id.startsWith("ose.")) ?? ids[0];
  if (!target) return;
  const doc = actor as unknown as {
    setFlag(scope: string, key: string, value: unknown): Promise<unknown>;
    sheet?: { render(force: boolean): unknown } | null;
  };
  await doc.setFlag("core", "sheetClass", target);
  // The sheet cache clears asynchronously with the flag update — give it a beat
  // before resolving the (new) default sheet and rendering it.
  setTimeout(() => {
    try {
      doc.sheet?.render(true);
    } catch {
      /* user can reopen from the sidebar */
    }
  }, 150);
}

function IssuesLink({ children }: { children: ReactNode }) {
  return (
    <a
      href={issuesUrl()}
      target="_blank"
      rel="noreferrer"
      style={{
        color: "var(--gold)",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {children}
    </a>
  );
}

type FallbackProps = {
  error: Error;
  componentStack?: string;
  onReopen: () => void;
  actor?: OSEActor;
};

type SendState = "idle" | "sending" | "sent" | "failed";

const SEND_LABEL: Record<SendState, string> = {
  idle: "Send bug report",
  sending: "Sending…",
  sent: "Report sent ✓",
  failed: "Retry send",
};

function CrashFallback({ error, componentStack, onReopen, actor }: FallbackProps) {
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const canSend = hasDsn();
  // Built by the same code path the sender consumes — the disclosure below
  // shows exactly what would leave the client, already scrubbed.
  const report = useMemo(
    () => buildCrashReport(error, componentStack),
    [error, componentStack],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatCrashReport(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the payload <pre> is selectable */
    }
  };

  const send = async () => {
    setSendState("sending");
    setSendState((await sendCrashReport(report)) ? "sent" : "failed");
  };

  // Vellum utilities + a few layout/typography one-offs inline; no crash.scss.
  return (
    <div
      className="u-stack u-items-start u-justify-center u-mx-auto u-py-8 u-px-6"
      style={{ height: "100%", maxWidth: "56ch" }}
    >
      <SectionTitle variant="bare">Well, this is embarrassing</SectionTitle>
      <p className="u-m-0 u-text-dim" style={{ fontSize: "var(--fs-base)" }}>
        Sorry — the sheet hit an error it couldn&apos;t recover from. Your
        character data is safe; only the display crashed.
      </p>
      <p
        className="mono u-m-0 u-text-danger"
        style={{ fontSize: "var(--fs-sm)", overflowWrap: "anywhere" }}
      >
        {error.name}: {error.message}
      </p>
      <div className="u-row u-mt-2">
        <Button variant="primary" onClick={onReopen}>
          Reopen sheet
        </Button>
        {actor && (
          <Button
            variant="outline"
            onClick={() => void switchToDefaultSheet(actor).catch(() => {})}
          >
            Use default sheet
          </Button>
        )}
      </div>
      <p className="u-m-0 u-mt-2 u-text-dim" style={{ fontSize: "var(--fs-sm)" }}>
        {canSend ? (
          <>
            Help fix this by sending an anonymous bug report: the error
            message, stack trace, and module/Foundry/OSE versions — nothing
            else. Actor names, user names, and world data are scrubbed on your
            machine before anything is sent.
          </>
        ) : (
          <>
            Help fix this: copy the error details and paste them into a{" "}
            <IssuesLink>GitHub issue</IssuesLink>.
          </>
        )}
      </p>
      <div className="u-row">
        {canSend && (
          <Button
            size="sm"
            variant="outline"
            disabled={sendState === "sending" || sendState === "sent"}
            onClick={() => void send()}
          >
            {SEND_LABEL[sendState]}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy error details"}
        </Button>
      </div>
      {sendState === "failed" && (
        <p className="u-m-0 u-text-danger" style={{ fontSize: "var(--fs-xs)" }}>
          Couldn&apos;t send the report — check your connection and retry, or
          copy the details instead.
        </p>
      )}
      <details className="u-mt-2" style={{ alignSelf: "stretch" }}>
        <summary
          className="u-text-muted"
          style={{
            cursor: "pointer",
            fontSize: "var(--fs-xs)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          See what&apos;s included
        </summary>
        <pre
          className="mono u-my-2 u-p-3 u-text-dim u-bg-surface u-border-soft"
          style={{
            maxHeight: "14rem",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontSize: "var(--fs-2xs)",
            borderRadius: "var(--r-md)",
            userSelect: "text",
          }}
        >
          {JSON.stringify(report, null, 2)}
        </pre>
      </details>
      {canSend && (
        <p className="u-m-0 u-text-muted" style={{ fontSize: "var(--fs-xs)" }}>
          If this keeps happening, please{" "}
          <IssuesLink>file an issue</IssuesLink> with the copied details.
        </p>
      )}
    </div>
  );
}

type BoundaryProps = { actor?: OSEActor; children: ReactNode };
type BoundaryState = {
  error: Error | null;
  componentStack?: string;
  /** Bumped on "Reopen sheet" to remount the subtree with fresh state. */
  epoch: number;
};

export class SheetErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { error: null, epoch: 0 };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(_error: Error, info: { componentStack?: string | null }) {
    this.setState({ componentStack: info.componentStack ?? undefined });
  }

  #reopen = () => {
    this.setState((s) => ({
      error: null,
      componentStack: undefined,
      epoch: s.epoch + 1,
    }));
  };

  render() {
    const { error, componentStack, epoch } = this.state;
    if (error) {
      return (
        <CrashFallback
          error={error}
          componentStack={componentStack}
          onReopen={this.#reopen}
          actor={this.props.actor}
        />
      );
    }
    // key remounts children after "Reopen sheet" so no crashed state survives
    return <Fragment key={epoch}>{this.props.children}</Fragment>;
  }
}

const CRASH_TEST_EVENT = "osc-crash-test";

/** Dev/debug hook: throws on the next render after a `osc-crash-test` window
 *  event (dispatched by `game.modules.get("osc-character-sheet").api.crashTest()`).
 *  Renders nothing and does nothing unless deliberately triggered. */
export function CrashTestProbe() {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const arm = () => setArmed(true);
    window.addEventListener(CRASH_TEST_EVENT, arm);
    return () => window.removeEventListener(CRASH_TEST_EVENT, arm);
  }, []);
  if (armed) {
    throw new Error(
      "Deliberate crash-test error (api.crashTest()) — not a real bug",
    );
  }
  return null;
}
