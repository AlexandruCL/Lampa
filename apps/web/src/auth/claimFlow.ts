import { ClaimResult, type ClaimIn } from "@lampa/shared";
import { getToken } from "../session";
import { authApi } from "./authApi";

export const CLAIM_RETURN_KEY = "lampa.claimReturnTo";
export const CLAIM_RESULT_KEY = "lampa.claimResult";
export const SIGN_IN_RETURN_KEY = "lampa.signInReturnTo";

const AUTH_ERROR_PARAMS = ["error", "error_description", "state", "iss"];

/** Where a cancelled or denied sign-in goes back to, or null when the URL is not an Auth0 error return. */
export function cancelledReturn(currentUrl: string, stored: string | null): string | null {
  const current = new URL(currentUrl);
  if (!current.searchParams.has("error") || !current.searchParams.has("state")) return null;
  const target = new URL(stored ?? current.pathname + current.search, current.origin);
  for (const name of AUTH_ERROR_PARAMS) target.searchParams.delete(name);
  return target.pathname + target.search + target.hash;
}

// sessionStorage can throw (blocked storage, some private modes); a failed read is null, a failed write is false.
export function readSession(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null): boolean {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** The SDK types the Auth0 token as optional (only cache-only mode leaves it unset); treat that as a failure. */
export const requireToken = (get: () => Promise<string | undefined>) => async (): Promise<string> => {
  const token = await get();
  if (!token) throw new Error("No access token");
  return token;
};

/** Moves the visitor's anonymous rows to their Auth0 account. */
export async function claimAnonymous(getAuth0Token: () => Promise<string>): Promise<ClaimResult> {
  const body: ClaimIn = { anonToken: await getToken() };
  const result = await authApi("/me/claim", await getAuth0Token(), ClaimResult, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!result) throw new Error("The claim answered without a result");
  return result;
}

export function nextClaimStep({ isAuthenticated, returnTo }: { isAuthenticated: boolean; returnTo: string | null }) {
  return isAuthenticated && returnTo ? "claim" : "wait";
}
