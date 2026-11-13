import type { ZodType } from "zod";
import { API_URL, ApiError } from "../api/client";

// Auth0 token only: phone calls keep the anonymous token through api() and authFetch.
async function send(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(API_URL + path, { ...init, headers });
  if (!res.ok) throw new ApiError(res.status);
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
