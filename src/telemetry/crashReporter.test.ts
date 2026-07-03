import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mocked Sentry chunk: counts loads (to prove laziness) and simulates the
// transport so delivery success/failure is controllable per test.
const sentry = vi.hoisted(() => ({
  loads: 0,
  sendResult: { statusCode: 200 } as { statusCode?: number },
  sendError: null as Error | null,
  captured: [] as Array<Record<string, unknown>>,
}));

vi.mock("./sentryClient", () => {
  sentry.loads++;
  type Options = {
    transport: (o: object) => {
      send(req: unknown): PromiseLike<{ statusCode?: number }>;
    };
    beforeSend: (e: unknown) => unknown;
  };
  class BrowserClient {
    options: Options;
    pending: Promise<unknown>[] = [];
    constructor(options: Options) {
      this.options = options;
    }
    init() {}
    async flush() {
      await Promise.allSettled(this.pending);
      return true;
    }
  }
  class Scope {
    client!: BrowserClient;
    setClient(c: BrowserClient) {
      this.client = c;
    }
    setTag() {}
    captureEvent(event: Record<string, unknown>) {
      const processed = this.client.options.beforeSend(event);
      sentry.captured.push(processed as Record<string, unknown>);
      const transport = this.client.options.transport({});
      this.client.pending.push(
        Promise.resolve(transport.send([])).catch(() => {}),
      );
    }
  }
  return {
    BrowserClient,
    Scope,
    defaultStackParser: (stack: string) =>
      stack ? [{ function: "parsed", filename: "app.js" }] : [],
    makeFetchTransport: () => ({
      send: async () => {
        if (sentry.sendError) throw sentry.sendError;
        return sentry.sendResult;
      },
      flush: async () => true,
    }),
  };
});

/** Fresh module instance with a controlled build-time DSN. */
async function loadReporter(dsn: string) {
  vi.resetModules();
  vi.stubEnv("VITE_SENTRY_DSN", dsn);
  return await import("./crashReporter");
}

const DSN = "https://abc123@o0.ingest.sentry.example/1";

function stubGame() {
  (globalThis as { game?: unknown }).game = {
    users: [{ name: "Tim the GM" }],
    actors: [{ name: "Grimble Toadfoot" }],
    modules: { get: () => ({ version: "1.2.3" }) },
    version: "14.359",
    system: { version: "2.0.0" },
  };
}

beforeEach(() => {
  sentry.loads = 0;
  sentry.sendResult = { statusCode: 200 };
  sentry.sendError = null;
  sentry.captured = [];
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as { game?: unknown }).game;
});

describe("buildCrashReport", () => {
  it("scrubs actor/user names and Foundry ids, and records versions", async () => {
    stubGame();
    const { buildCrashReport } = await loadReporter(DSN);
    const err = new Error(
      "Grimble Toadfoot (Actor.a1B2c3D4e5F6g7H8) exploded",
    );
    const report = buildCrashReport(err, "at Sheet for Tim the GM");
    expect(report.errorMessage).toBe("[redacted] ([redacted]) exploded");
    expect(report.componentStack).toBe("at Sheet for [redacted]");
    expect(report.stack).not.toContain("Grimble");
    expect(report.moduleVersion).toBe("1.2.3");
    expect(report.foundryVersion).toBe("14.359");
    expect(report.oseVersion).toBe("2.0.0");
  });

  it("survives a missing game global (storybook/tests)", async () => {
    const { buildCrashReport } = await loadReporter(DSN);
    const report = buildCrashReport(new Error("boom"));
    expect(report.errorMessage).toBe("boom");
    expect(report.moduleVersion).toBe("unknown");
    expect(report.foundryVersion).toBe("unknown");
  });
});

describe("formatCrashReport", () => {
  it("renders error, stack, and versions as pasteable text", async () => {
    const { buildCrashReport, formatCrashReport } = await loadReporter(DSN);
    const text = formatCrashReport(buildCrashReport(new Error("boom")));
    expect(text).toContain("Error: boom");
    expect(text).toContain("Versions:");
    expect(text).toContain("Foundry unknown");
  });
});

describe("sendCrashReport", () => {
  it("never loads the Sentry chunk before a send", async () => {
    const { buildCrashReport, sendCrashReport } = await loadReporter(DSN);
    buildCrashReport(new Error("boom"));
    expect(sentry.loads).toBe(0);
    await sendCrashReport(buildCrashReport(new Error("boom")));
    expect(sentry.loads).toBe(1);
  });

  it("sends an event built from the report's fields and resolves true on 2xx", async () => {
    const { buildCrashReport, sendCrashReport } = await loadReporter(DSN);
    const report = buildCrashReport(new Error("boom"));
    expect(await sendCrashReport(report)).toBe(true);
    const event = sentry.captured[0] as {
      exception: { values: Array<{ type: string; value: string }> };
      extra: { stack: string };
    };
    expect(event.exception.values[0].type).toBe(report.errorName);
    expect(event.exception.values[0].value).toBe(report.errorMessage);
    expect(event.extra.stack).toBe(report.stack);
  });

  it("resolves false on transport failure, and a retry can succeed", async () => {
    const { buildCrashReport, sendCrashReport } = await loadReporter(DSN);
    const report = buildCrashReport(new Error("boom"));
    sentry.sendError = new Error("offline");
    expect(await sendCrashReport(report)).toBe(false);
    sentry.sendError = null;
    expect(await sendCrashReport(report)).toBe(true);
  });

  it("resolves false on a 4xx/5xx response", async () => {
    const { buildCrashReport, sendCrashReport } = await loadReporter(DSN);
    sentry.sendResult = { statusCode: 429 };
    expect(await sendCrashReport(buildCrashReport(new Error("boom")))).toBe(
      false,
    );
  });

  it("without a DSN: resolves false and never loads the chunk", async () => {
    const { buildCrashReport, sendCrashReport, hasDsn } = await loadReporter("");
    expect(hasDsn()).toBe(false);
    expect(await sendCrashReport(buildCrashReport(new Error("boom")))).toBe(
      false,
    );
    expect(sentry.loads).toBe(0);
  });

  it("caps successful sends per session", async () => {
    const { buildCrashReport, sendCrashReport } = await loadReporter(DSN);
    const report = buildCrashReport(new Error("boom"));
    for (let i = 0; i < 5; i++) {
      expect(await sendCrashReport(report)).toBe(true);
    }
    expect(await sendCrashReport(report)).toBe(false);
  });
});
