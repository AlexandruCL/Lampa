import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Button, Notice } from "../components";
import { CLAIM_RESULT_KEY, claimAnonymous, readSession, requireToken, writeSession } from "./claimFlow";

type Outcome = "saved" | "failed";

/** DESIGN.md 7.10. Signed out: the sign-in button. Signed in: the claim outcome once, then nothing. */
export function KeepMyColours() {
  const { isLoading, isAuthenticated, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const stored = readSession(CLAIM_RESULT_KEY);
    writeSession(CLAIM_RESULT_KEY, null);
    if (stored === "saved" || stored === "failed") setOutcome(stored);
  }, []);

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    claimAnonymous(requireToken(getAccessTokenSilently))
      .then(
        () => setOutcome("saved"),
        () => setOutcome("failed"),
      )
      .finally(() => setRetrying(false));
  };

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Button
        variant="quiet"
        block
        onClick={() =>
          loginWithRedirect({ appState: { claim: true, returnTo: location.pathname + location.search } })
        }
      >
        Keep my colours
      </Button>
    );
  }

  if (outcome === "saved") return <Notice variant="info">Saved. Your colours stay with your account.</Notice>;
  if (outcome === "failed") {
    return (
      <Notice variant="error" action={{ label: "Try again", onClick: retry }}>
        You are signed in, but your colours did not move to your account.
      </Notice>
    );
  }
  return null;
}
