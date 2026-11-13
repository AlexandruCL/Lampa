import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { API_URL, ApiError } from "../api/client";
import { authApi, authBlob } from "./authApi";

function stubFetch(response: Response) {
  const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const Ok = z.object({ ok: z.literal(true) });

afterEach(() => vi.unstubAllGlobals());

describe("authApi", () => {
  it("sends the Auth0 token as a Bearer header", async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ ok: true })));
    await expect(authApi("/admin/echoes", "auth0tok", Ok)).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API_URL}/admin/echoes`);
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer auth0tok");
  });

  it("a 204 returns undefined", async () => {
    stubFetch(new Response(null, { status: 204 }));
    await expect(authApi("/admin/echoes/1", "auth0tok", Ok, { method: "PATCH" })).resolves.toBeUndefined();
  });

  it("a 403 throws ApiError 403", async () => {
    stubFetch(new Response("{}", { status: 403 }));
    const err = await authApi("/admin/echoes", "auth0tok", Ok).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(403);
  });

  it("a body that fails the schema throws", async () => {
    stubFetch(new Response(JSON.stringify({ ok: "yes" })));
    await expect(authApi("/admin/echoes", "auth0tok", Ok)).rejects.toThrow(z.ZodError);
  });

  it("authBlob returns the response blob", async () => {
    const fetchMock = stubFetch(new Response(new Blob(["audio"], { type: "audio/webm" })));
    const blob = await authBlob("/admin/echoes/1/audio", "auth0tok");
    expect(blob.type).toBe("audio/webm");
    expect(await blob.text()).toBe("audio");
    expect(new Headers(fetchMock.mock.calls[0]![1]?.headers).get("Authorization")).toBe("Bearer auth0tok");
  });
});
