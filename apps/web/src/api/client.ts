import { z } from "zod";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const SESSION_KEY = "lampa.session";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: unknown;
    schema: z.ZodType<T>;
  },
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = typeof localStorage !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(API_URL + path, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) throw new ApiError(res.status);
  return options.schema.parse(await res.json());
}

export const Health = z.object({ ok: z.literal(true) });

export function getHealth() {
  return api("/health", { schema: Health });
}
