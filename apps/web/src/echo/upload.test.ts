import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { ApiError } from "../api/client";
import { authFetch } from "../session";
import type { Recording } from "./recording";
import { echoFileName, sendEcho, toEchoForm } from "./upload";

// session.ts owns the Bearer header and the 401 retry; session.test.ts covers them.
vi.mock("../session", () => ({ authFetch: vi.fn() }));

const authFetchMock = vi.mocked(authFetch);

function stubAuthFetch(status: number, body: unknown) {
  authFetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

function sentCall(): [string, RequestInit] {
  return authFetchMock.mock.calls[0] as [string, RequestInit];
}

function recording(overrides: Partial<Recording> = {}): Recording {
  return { blob: new Blob(["abc"], { type: "audio/webm" }), mimeType: "audio/webm", durationMs: 4200, ...overrides };
}

afterEach(() => {
  authFetchMock.mockReset();
});

describe("echo upload", () => {
  it("the form carries the audio file, the site, consent true and the duration", async () => {
    const rec = recording();
    const form = toEchoForm(rec, "site-1");
    const audio = form.get("audio") as File;
    expect(audio).toBeInstanceOf(Blob);
    expect(audio.name).toBe("echo.webm");
    expect(await audio.text()).toBe("abc");
    expect(form.get("siteId")).toBe("site-1");
    expect(form.get("consent")).toBe("true");
    expect(form.get("durationMs")).toBe("4200");
    expect([...form.keys()]).toEqual(["audio", "siteId", "consent", "durationMs"]);
  });

  it("the file is named echo.webm for webm and echo.mp4 for mp4", () => {
    expect(echoFileName("audio/webm")).toBe("echo.webm");
    expect(echoFileName("audio/mp4")).toBe("echo.mp4");
    const form = toEchoForm(recording({ blob: new Blob(["x"], { type: "audio/mp4" }), mimeType: "audio/mp4" }), "s");
    expect((form.get("audio") as File).name).toBe("echo.mp4");
  });

  it("the prompt is sent only when given", () => {
    expect(toEchoForm(recording(), "s").has("prompt")).toBe(false);
    expect(toEchoForm(recording(), "s", "Why this colour?").get("prompt")).toBe("Why this colour?");
  });

  it("a duration under 1000 ms is refused before sending", async () => {
    const send = async () => sendEcho(toEchoForm(recording({ durationMs: 999 }), "s"));
    await expect(send()).rejects.toBeInstanceOf(ZodError);
    expect(authFetchMock).not.toHaveBeenCalled();
  });

  it("a 201 gives the parsed EchoAccepted", async () => {
    stubAuthFetch(201, { id: "echo-1", status: "pending" });
    await expect(sendEcho(toEchoForm(recording(), "s"))).resolves.toEqual({ id: "echo-1", status: "pending" });
    expect(sentCall()[0]).toBe("/echoes");
    expect(sentCall()[1].method).toBe("POST");
    expect(sentCall()[1].body).toBeInstanceOf(FormData);
  });

  it("the request sets no Content-Type header", async () => {
    stubAuthFetch(201, { id: "echo-1", status: "pending" });
    await sendEcho(toEchoForm(recording(), "s"));
    const headers = new Headers(sentCall()[1].headers);
    expect(headers.has("Content-Type")).toBe(false);
  });

  it("a 413 throws ApiError with its status", async () => {
    stubAuthFetch(413, { error: "too large" });
    const error = await sendEcho(toEchoForm(recording(), "s")).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(413);
  });

  it("an answer that fails the schema throws", async () => {
    stubAuthFetch(201, { id: "echo-1", status: "done" });
    await expect(sendEcho(toEchoForm(recording(), "s"))).rejects.toBeInstanceOf(ZodError);
  });

  it("a failed send is not retried", async () => {
    authFetchMock.mockRejectedValue(new TypeError("network down"));
    await expect(sendEcho(toEchoForm(recording(), "s"))).rejects.toBeInstanceOf(TypeError);
    stubAuthFetch(500, {});
    await expect(sendEcho(toEchoForm(recording(), "s"))).rejects.toBeInstanceOf(ApiError);
    expect(authFetchMock).toHaveBeenCalledTimes(2);
  });
});
