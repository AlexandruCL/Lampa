import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, type ReactNode } from "react";
import {
  CLAIM_RESULT_KEY,
  CLAIM_RETURN_KEY,
  SIGN_IN_RETURN_KEY,
  cancelledReturn,
  claimAnonymous,
  nextClaimStep,
  readSession,
  requireToken,
  writeSession,
} from "./claimFlow";

/**
 * After a Keep my colours sign-in: claim once, keep the outcome for KeepMyColours, then go back to the page.
 * After a cancelled or denied sign-in: go back to the page with no message.
 */
function ClaimOnReturn() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const started = useRef(false);

  useEffect(() => {
    const target = cancelledReturn(window.location.href, readSession(SIGN_IN_RETURN_KEY));
    if (!target) return;
    writeSession(SIGN_IN_RETURN_KEY, null);
    window.location.replace(target);
  }, []);

  useEffect(() => {
    const returnTo = readSession(CLAIM_RETURN_KEY);
    if (started.current || !returnTo || nextClaimStep({ isAuthenticated, returnTo }) !== "claim") return;
    started.current = true;
    claimAnonymous(requireToken(getAccessTokenSilently))
      .then(
        () => "saved",
        () => "failed",
      )
      .then((result) => {
        writeSession(CLAIM_RESULT_KEY, result);
        writeSession(CLAIM_RETURN_KEY, null);
        window.location.replace(returnTo);
      });
  }, [isAuthenticated, getAccessTokenSilently]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Local dev without the tenant: useAuth0 stays isLoading, so /curate waits and KeepMyColours hides.
  if (!import.meta.env.VITE_AUTH0_DOMAIN) return children;
  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
      cacheLocation="localstorage"
      useRefreshTokens
      onRedirectCallback={(appState) => {
        writeSession(SIGN_IN_RETURN_KEY, null);
        const returnTo = appState?.returnTo ?? window.location.pathname;
        // A claim stays on this page until ClaimOnReturn has run; if storage is blocked, skip the claim and go back.
        if (appState?.claim && writeSession(CLAIM_RETURN_KEY, returnTo)) return;
        // Full reload back to the page the visitor left; the session survives in local storage.
        window.location.replace(returnTo);
      }}
    >
      {children}
      <ClaimOnReturn />
    </Auth0Provider>
  );
}
