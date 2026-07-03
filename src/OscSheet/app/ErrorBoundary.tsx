// Error boundary at the sheet root: a render crash shows a vellum fallback
// instead of killing the Foundry client or leaving a dead window. Routes the
// error to the opt-in crash reporter (no-op without consent).

import { Component, Fragment, useEffect, useState, type ReactNode } from "react";
import { Button } from "@ui/Button";
import { SectionTitle } from "@ui/SectionTitle";
import { MODULE_ID } from "@domain/flags";
import type { OSEActor } from "@domain/types";
import { reportError } from "@src/telemetry/crashReporter";

const FALLBACK_REPO_URL = "https://github.com/tasandberg/osc-character-sheet";

function issuesUrl(): string {
  try {
    const mod = game.modules?.get(MODULE_ID) as { url?: string } | undefined;
    return `${mod?.url || FALLBACK_REPO_URL}/issues`;
  } catch {
    return `${FALLBACK_REPO_URL}/issues`;
  }
}

function actorKind(actor?: OSEActor): string {
  if (!actor) return "unknown";
  const system = actor.system as { retainer?: { enabled?: boolean } };
  if (system?.retainer?.enabled) return "retainer";
  return (actor as { type?: string }).type ?? "unknown";
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

type FallbackProps = {
  error: Error;
  componentStack?: string;
  onReopen: () => void;
  actor?: OSEActor;
};

function CrashFallback({ error, componentStack, onReopen, actor }: FallbackProps) {
  const [copied, setCopied] = useState(false);
  const details = [
    `${error.name}: ${error.message}`,
    error.stack ?? "(no stack)",
    componentStack ? `Component stack:${componentStack}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the <pre> is selectable */
    }
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
          Technical details
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
          {details}
        </pre>
        <Button size="sm" variant="ghost" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy for bug report"}
        </Button>
      </details>
      <p className="u-m-0 u-text-muted" style={{ fontSize: "var(--fs-xs)" }}>
        If this keeps happening, please{" "}
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
          file an issue
        </a>{" "}
        with the copied details.
      </p>
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

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    this.setState({ componentStack: info.componentStack ?? undefined });
    reportError(error, {
      actorKind: actorKind(this.props.actor),
      componentStack: info.componentStack ?? undefined,
    });
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
