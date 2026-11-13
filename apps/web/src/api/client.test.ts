import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError, z } from "zod";
import { API_URL, ApiError, SESSION_KEY, api, getHealth } from "./client";

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubSession(value: string | null) {
  vi.stubGlobal("localStorage", { getItem: (key: string) => (key === SESSION_KEY ? value : null) });
}

function sentInit(fetchMock: ReturnType<typeof stubFetch>): RequestInit {
  const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return call[1];
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("returns the parsed body on a 200", async () => {
    stubSession(null);
    const fetchMock = stubFetch(200, { ok: true });
    await expect(getHealth()).resolves.toEqual({ ok: true });
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe(API_URL + "/health");
    expect(sentInit(fetchMock).method).toBe("GET");
  });

  it("throws ApiError with the status on a 500", async () => {
    stubSession(null);
    stubFetch(500, { error: "boom" });
    const error = await getHealth().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(500);
  });

  it("rejects a 200 body that fails the schema", async () => {
    stubSession(null);
    stubFetch(200, { ok: false });
    await expect(getHealth()).rejects.toBeInstanceOf(ZodError);
  });

  it("sends the Bearer header when lampa.session is set", async () => {
    stubSession("abc123");
    const fetchMock = stubFetch(200, { ok: true });
    await getHealth();
    expect(sentInit(fetchMock).headers).toMatchObject({ Authorization: "Bearer abc123" });
  });

  it("sends no Authorization header when lampa.session is missing", async () => {
    stubSession(null);
    const fetchMock = stubFetch(200, { ok: true });
    await getHealth();
    expect(sentInit(fetchMock).headers).not.toHaveProperty("Authorization");
  });

  it("sends a JSON body with its content type on a POST", async () => {
    stubSession(null);
    const fetchMock = stubFetch(200, { id: "x" });
    await api("/things", { method: "POST", body: { name: "lamp" }, schema: z.object({ id: z.string() }) });
    const init = sentInit(fetchMock);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "lamp" }));
    expect(init.headers).toMatchObject({ "Content-Type": "application/json" });
  });
});
