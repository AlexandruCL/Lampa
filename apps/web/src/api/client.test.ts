import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import { authFetch } from "../session";
import { ApiError, api, getHealth } from "./client";

// session.ts owns the Bearer header and the 401 retry; session.test.ts covers them.
vi.mock("../session", () => ({ authFetch: vi.fn() }));

const authFetchMock = vi.mocked(authFetch);

function stubAuthFetch(status: number, body: unknown) {
  authFetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function sentCall(): [string, RequestInit] {
  return authFetchMock.mock.calls[0] as [string, RequestInit];
}

afterEach(() => {
  authFetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("returns the parsed body on a 200", async () => {
    stubAuthFetch(200, { ok: true });
    await expect(getHealth()).resolves.toEqual({ ok: true });
    expect(sentCall()[0]).toBe("/health");
    expect(sentCall()[1].method).toBe("GET");
  });

  it("throws ApiError with the status on a 500", async () => {
    stubAuthFetch(500, { error: "boom" });
    const error = await getHealth().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("rejects a 200 body that fails the schema", async () => {
    stubAuthFetch(200, { ok: false });
    await expect(getHealth()).rejects.toBeInstanceOf(ZodError);
  });

  it("sends the request through authFetch, not fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    stubAuthFetch(200, { ok: true });
    await getHealth();
    expect(authFetchMock).toHaveBeenCalledOnce();
    expect(sentCall()[0]).toBe("/health");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sets no Authorization header itself", async () => {
    vi.stubGlobal("localStorage", { getItem: () => "abc123" });
    stubAuthFetch(200, { ok: true });
    await getHealth();
    expect(sentCall()[1].headers).not.toHaveProperty("Authorization");
  });

  it("sends a JSON body with its content type on a POST", async () => {
    stubAuthFetch(200, { id: "x" });
    await api("/things", { method: "POST", body: { name: "lamp" }, schema: z.object({ id: z.string() }) });
    const init = sentCall()[1];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "lamp" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });
});
