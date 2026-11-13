import { Auth0Provider } from "@auth0/auth0-react";
import type { ReactNode } from "react";

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
      // Full reload back to the page the visitor left; the session survives in local storage.
      onRedirectCallback={(appState) => window.location.replace(appState?.returnTo ?? window.location.pathname)}
    >
      {children}
    </Auth0Provider>
  );
}
