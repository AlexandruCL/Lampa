import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL, SESSION_KEY } from "./api/client";

let session: typeof import("./session");
let store: Map<string, string>;

function stubStorage() {
  store = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
}

// Each POST /session/anon answers the next token; other paths answer the next status in `statuses`.
function stubFetch(statuses: number[] = []) {
  let issued = 0;
  const fetchMock = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === `${API_URL}/session/anon`) {
      return new Response(JSON.stringify({ token: `tok${++issued}`, expiresAt: "2026-11-14T12:00:00.000Z" }));
    }
    return new Response("{}", { status: statuses.shift() ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const tokenRequests = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url]) => url === `${API_URL}/session/anon`).length;
const authHeaders = (fetchMock: ReturnType<typeof stubFetch>, path: string) =>
  fetchMock.mock.calls
    .filter(([url]) => url === API_URL + path)
    .map(([, init]) => new Headers(init?.headers).get("Authorization"));

beforeEach(async () => {
  vi.resetModules();
  session = await import("./session");
  stubStorage();
});
afterEach(() => vi.unstubAllGlobals());

describe("session", () => {
  it("first call requests a token and stores the raw token under lampa.session", async () => {
    const fetchMock = stubFetch();
    await expect(session.getToken()).resolves.toBe("tok1");
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/session/anon`, { method: "POST" });
    expect(store.get(SESSION_KEY)).toBe("tok1");
  });

  it("a stored token is reused without a request", async () => {
    store.set(SESSION_KEY, "saved");
    const fetchMock = stubFetch();
    await expect(session.getToken()).resolves.toBe("saved");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("an empty stored value requests a new token", async () => {
    store.set(SESSION_KEY, "");
    const fetchMock = stubFetch();
    await expect(session.getToken()).resolves.toBe("tok1");
    expect(tokenRequests(fetchMock)).toBe(1);
  });

  it("two concurrent getToken calls make one request", async () => {
    const fetchMock = stubFetch();
    await expect(Promise.all([session.getToken(), session.getToken()])).resolves.toEqual(["tok1", "tok1"]);
    expect(tokenRequests(fetchMock)).toBe(1);
  });

  it("authFetch retries once after a 401 with a new token", async () => {
    store.set(SESSION_KEY, "expired");
    const fetchMock = stubFetch([401, 200]);
    const res = await session.authFetch("/me", { method: "POST", body: "{}" });
    expect(res.status).toBe(200);
    expect(authHeaders(fetchMock, "/me")).toEqual(["Bearer expired", "Bearer tok1"]);
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe("POST");
    expect(store.get(SESSION_KEY)).toBe("tok1");
  });

  it("authFetch returns the second 401", async () => {
    const fetchMock = stubFetch([401, 401, 200]);
    const res = await session.authFetch("/me");
    expect(res.status).toBe(401);
    expect(authHeaders(fetchMock, "/me")).toEqual(["Bearer tok1", "Bearer tok2"]);
  });

  it("storage that throws falls back to memory", async () => {
    const fail = () => {
      throw new DOMException("denied", "SecurityError");
    };
    vi.stubGlobal("localStorage", { getItem: fail, setItem: fail, removeItem: fail });
    const fetchMock = stubFetch();
    await expect(session.getToken()).resolves.toBe("tok1");
    await expect(session.getToken()).resolves.toBe("tok1");
    expect(tokenRequests(fetchMock)).toBe(1);
  });
});
