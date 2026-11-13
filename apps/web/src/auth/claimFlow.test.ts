import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { API_URL, ApiError, SESSION_KEY } from "../api/client";
import { cancelledReturn, claimAnonymous, nextClaimStep } from "./claimFlow";

const auth0Token = async () => "auth0tok";

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  const store = new Map([[SESSION_KEY, "anontok"]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("claimAnonymous", () => {
  it("posts the anonymous token in the body and the Auth0 token in the header", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ panes: 3, echoes: 1, events: 9 })));
    await expect(claimAnonymous(auth0Token)).resolves.toEqual({ panes: 3, echoes: 1, events: 9 });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_URL}/me/claim`);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toEqual({ anonToken: "anontok" });
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer auth0tok");
  });

  it("a 400 throws so the Notice offers Try again", async () => {
    stubFetch(new Response("{}", { status: 400 }));
    const err = await claimAnonymous(auth0Token).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(400);
  });

  it("a result that fails ClaimResult throws", async () => {
    stubFetch(new Response(JSON.stringify({ panes: -1, echoes: 0, events: 0 })));
    await expect(claimAnonymous(auth0Token)).rejects.toThrow(z.ZodError);
  });
});

describe("cancelledReturn", () => {
  it("a cancelled sign-in returns to the stored page without the error parameters", () => {
    const back = "http://localhost:5173/?error=access_denied&error_description=Cancelled&state=abc&iss=https%3A%2F%2Ft";
    expect(cancelledReturn(back, "/s/piata-unirii?lang=ro")).toBe("/s/piata-unirii?lang=ro");
    expect(cancelledReturn("http://localhost:5173/curate?error=access_denied&state=abc", null)).toBe("/curate");
    expect(cancelledReturn("http://localhost:5173/s/piata-unirii", "/s/piata-unirii")).toBeNull();
  });
});

describe("nextClaimStep", () => {
  it("a signed-in return with a stored returnTo claims", () => {
    expect(nextClaimStep({ isAuthenticated: true, returnTo: "/s/piata-unirii" })).toBe("claim");
  });

  it("a signed-out return waits", () => {
    expect(nextClaimStep({ isAuthenticated: false, returnTo: "/s/piata-unirii" })).toBe("wait");
  });

  it("a signed-in visit with no stored returnTo waits", () => {
    expect(nextClaimStep({ isAuthenticated: true, returnTo: null })).toBe("wait");
  });
});
