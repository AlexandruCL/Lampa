// Simulates a crowd against the API: anon sessions that send a wake every 2 s and one vivid pane each tick,
// with --lamps a lamp each minute, and with --candles <n> n candles at the memorial from the first session.
// Starts no server and reads no .env. Prints statuses only, never a token or a body.
import assert from "node:assert";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";
import { parseArgs } from "node:util";
import { EventsAccepted, PaneAccepted, PaneIn, hueBin, sites, type EventBatch } from "@lampa/shared";

const TICK_MS = 2000;
const LAMP_EVERY_MS = 60_000;
const CANDLE_EVERY_MS = 2000;
const TIMEOUT_MS = 10000;
const ANON_LIMIT = 10; // the API allows 10 POST /session/anon a minute per IP
const ANON_WINDOW_MS = 61_000;

/** "#rrggbb" (lowercase) of an HSL colour: h in degrees, s and l in [0, 1]. */
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
assert.strictEqual(hslToHex(0, 1, 0.5), "#ff0000");
assert.strictEqual(hslToHex(240, 1, 0.5), "#0000ff");

function refuse(reason: string): never {
  console.log(`simulate:crowd: ${reason}`);
  process.exit(1);
}

const open = sites.filter((s) => !s.is_memorial).map((s) => s.id);
const memorial = sites.find((s) => s.is_memorial)?.id;
let opts: { api: string; sessions: string; seconds: string; site?: string; lamps: boolean; candles: string };
try {
  opts = parseArgs({
    options: {
      api: { type: "string", default: "http://localhost:3000" },
      sessions: { type: "string", default: "12" },
      seconds: { type: "string", default: "120" },
      site: { type: "string" },
      lamps: { type: "boolean", default: false },
      candles: { type: "string", default: "0" },
    },
  }).values;
} catch (err) {
  refuse((err as Error).message.split("\n")[0]);
}
if (opts.site !== undefined && !open.includes(opts.site)) refuse(`--site must be one of ${open.join(", ")}`);
const sessionCount = Number(opts.sessions);
if (!(Number.isInteger(sessionCount) && sessionCount > 0)) refuse("--sessions must be a positive integer");
const seconds = Number(opts.seconds);
if (!(Number.isFinite(seconds) && seconds > 0)) refuse("--seconds must be a positive number");
const candleCount = Number(opts.candles);
if (!(Number.isInteger(candleCount) && candleCount >= 0)) refuse("--candles must be a non-negative integer");
if (candleCount > 0 && memorial === undefined) refuse("--candles needs a memorial site in sites");
const api = opts.api.replace(/\/+$/, "");

const start = Date.now();
const deadline = start + seconds * 1000;
const count = { sessions: 0, panes: 0, windows: 0, events: 0, lamps: 0, candles: 0, rateLimited: 0, errors: 0 };
const printed = new Set<string>();

type Reply = { status: number; ok: boolean; retryAfter: string | null; body: unknown };

/** The reply with its JSON body (null if not JSON), or null on timeout or network error. */
async function send(method: string, path: string, token?: string, body?: unknown): Promise<Reply | null> {
  try {
    const res = await fetch(`${api}${path}`, {
      method,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, ok: res.ok, retryAfter: res.headers.get("retry-after"), body: json };
  } catch {
    return null;
  }
}

/** Counts an error and prints its line once per method, path and status. */
function fail(method: string, path: string, status: string) {
  count.errors++;
  const line = `${method} ${path} ${status}`;
  if (!printed.has(line)) console.log(line);
  printed.add(line);
}

const anonStamps: number[] = [];
/** Waits for a free slot (at most 10 anon requests in any 61 s, retries included); false if that wait runs past --seconds. */
async function anonSlot(): Promise<boolean> {
  for (;;) {
    const now = Date.now();
    while (anonStamps.length && anonStamps[0] <= now - ANON_WINDOW_MS) anonStamps.shift();
    if (anonStamps.length < ANON_LIMIT) {
      anonStamps.push(now); // claimed before any await, so concurrent sessions cannot overrun the slot
      return true;
    }
    const wait = anonStamps[0] + ANON_WINDOW_MS - now;
    if (now + wait > deadline) return false;
    await sleep(wait);
  }
}

async function openSession(): Promise<string | null> {
  const path = "/session/anon";
  for (;;) {
    // Blocked on Fabi: a slot that opens after --seconds is counted as an error, like a 429 wait past --seconds.
    if (!(await anonSlot())) {
      count.errors++; // no request was made, so no failure line
      return null;
    }
    const r = await send("POST", path);
    if (!r) {
      fail("POST", path, "network");
      return null;
    }
    if (r.status === 429) {
      // Blocked on Fabi: a 429 without a positive Retry-After is not retried (no tight loop), it is an error.
      const wait = Number(r.retryAfter) * 1000;
      if (wait > 0 && Date.now() + wait <= deadline) {
        await sleep(wait);
        continue;
      }
    }
    const token = (r.body as { token?: unknown } | null)?.token;
    if (r.ok && typeof token === "string") return token;
    fail("POST", path, String(r.status));
    return null;
  }
}

/** Sends one event in its own batch and adds what the API accepted to its counter. */
async function sendEvent(token: string, kind: "wake" | "lamp" | "candle", siteId: string) {
  const batch: EventBatch = { events: [{ kind, siteId, at: new Date().toISOString() }] };
  const r = await send("POST", "/events", token, batch);
  const accepted = r?.ok ? EventsAccepted.safeParse(r.body) : null;
  if (accepted?.success) count[kind === "wake" ? "events" : kind === "lamp" ? "lamps" : "candles"] += accepted.data.accepted;
  else fail("POST", "/events", !r ? "network" : String(r.status));
}

/** Sends `kind` at once and then every `everyMs`, at most `times` times, until --seconds have passed. */
async function repeat(token: string, kind: "lamp" | "candle", siteId: string, everyMs: number, times: number) {
  for (let i = 0, next = Date.now(); i < times && next < deadline; i++, next += everyMs) {
    await sleep(Math.max(0, next - Date.now()));
    await sendEvent(token, kind, siteId);
  }
}

/** Sends one random vivid pane; false once the API rate-limits this session's panes. */
async function sendPane(token: string, siteId: string): Promise<boolean> {
  const hue = Math.random() * 360;
  const pane = PaneIn.parse({
    siteId,
    hue,
    saturation: 0.8,
    lightness: 0.5,
    hex: hslToHex(hue, 0.8, 0.5),
    bin: hueBin(hue),
    at: new Date().toISOString(),
  });
  const r = await send("POST", "/panes", token, pane);
  if (r?.status === 429) {
    count.rateLimited++;
    return false;
  }
  const out = r?.ok ? PaneAccepted.safeParse(r.body) : null;
  if (!out?.success) {
    fail("POST", "/panes", !r ? "network" : String(r.status));
    return true;
  }
  count.panes++;
  if (out.data.completed) {
    count.windows++;
    console.log(`window complete at ${siteId} (${out.data.windowId})`);
  }
  return true;
}

async function runSession(siteId: string) {
  const token = await openSession();
  if (!token) return;
  count.sessions++;
  const extra: Promise<void>[] = [];
  if (opts.lamps) extra.push(repeat(token, "lamp", siteId, LAMP_EVERY_MS, Infinity));
  // The first session to get its token lights the candles.
  if (count.sessions === 1 && candleCount > 0) extra.push(repeat(token, "candle", memorial!, CANDLE_EVERY_MS, candleCount));
  let panesOn = true;
  for (let next = Date.now(); next < deadline; next += TICK_MS) {
    await sleep(Math.max(0, next - Date.now()));
    const wake = sendEvent(token, "wake", siteId);
    if (panesOn) panesOn = await sendPane(token, siteId);
    await wake;
  }
  await Promise.all(extra);
}

// No top-level await: the root package is not "type": "module", so tsx emits CJS.
async function main(): Promise<boolean> {
  const runs = Array.from({ length: sessionCount }, (_, i) => runSession(opts.site ?? open[i % open.length]));
  for (const r of await Promise.allSettled(runs)) if (r.status === "rejected") count.errors++;
  console.log(
    `simulate:crowd done: ${count.sessions} sessions, ${count.panes} panes, ${count.windows} windows completed, ` +
      `${count.events} events, ${count.lamps} lamps, ${count.candles} candles, ${count.rateLimited} rate limited, ${count.errors} errors`,
  );
  return count.panes > 0;
}

main().then((ok) => process.exit(ok ? 0 : 1));
