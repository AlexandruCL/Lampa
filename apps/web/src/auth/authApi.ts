import type { ZodType } from "zod";
import { API_URL, ApiError } from "../api/client";

/** An ApiError that also carries the body's `error` code, so the console can tell 409s apart. */
export class AuthApiError extends ApiError {
  readonly code?: string;

  constructor(status: number, code?: string) {
    super(status);
    this.name = "AuthApiError";
    this.code = code;
  }
}

/** The `init` for a JSON POST through authApi. */
export function postJson(body: unknown): RequestInit {
  return { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

// Auth0 token only: phone calls keep the anonymous token through api() and authFetch.
async function send(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(API_URL + path, { ...init, headers });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const code = (body as { error?: unknown } | null)?.error;
    throw new AuthApiError(res.status, typeof code === "string" ? code : undefined);
  }
  return res;
}

export async function authApi<T>(
  path: string,
  token: string,
  schema?: ZodType<T>,
  init?: RequestInit,
): Promise<T | undefined> {
  const res = await send(path, token, init);
  if (res.status === 204 || !schema) return undefined;
  return schema.parse(await res.json());
}

export async function authBlob(path: string, token: string): Promise<Blob> {
  return (await send(path, token)).blob();
}
