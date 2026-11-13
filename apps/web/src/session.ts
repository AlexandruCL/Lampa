import { z } from "zod";
import { API_URL, ApiError, SESSION_KEY } from "./api/client";

const AnonSession = z.object({ token: z.string().min(1) });

// Mirrors the stored token so the session survives when storage throws (private mode).
let memoryToken: string | null = null;
let pending: Promise<string> | null = null;

function load(): string | null {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(SESSION_KEY);
  } catch {}
  return stored || memoryToken;
}

function save(token: string | null) {
  memoryToken = token;
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

async function requestToken(): Promise<string> {
  const res = await fetch(`${API_URL}/session/anon`, { method: "POST" });
  if (!res.ok) throw new ApiError(res.status);
  const { token } = AnonSession.parse(await res.json());
  save(token);
  return token;
}

export async function getToken(): Promise<string> {
  return load() || (pending ??= requestToken().finally(() => (pending = null)));
}

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = async (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(API_URL + path, { ...init, headers });
  };
  const token = await getToken();
  const res = await send(token);
  if (res.status !== 401) return res;
  // Drop only our own token, so a concurrent 401 does not discard a fresh one.
  if (load() === token) save(null);
  return send(await getToken());
}
