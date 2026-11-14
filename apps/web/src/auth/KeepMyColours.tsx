import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Button, Notice } from "../components";
import { t } from "../i18n/t";
import {
  CLAIM_RESULT_KEY,
  SIGN_IN_RETURN_KEY,
  claimAnonymous,
  readSession,
  requireToken,
  writeSession,
} from "./claimFlow";
import styles from "./KeepMyColours.module.css";

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

  const signIn = () => {
    const returnTo = location.pathname + location.search;
    // A cancelled sign-in brings no appState back, so ClaimOnReturn finds the page here.
    writeSession(SIGN_IN_RETURN_KEY, returnTo);
    void loginWithRedirect({ appState: { claim: true, returnTo } });
  };

  if (isLoading || (isAuthenticated && !outcome)) return null;

  return (
    <div className={styles.root}>
      {!isAuthenticated ? (
        <Button variant="quiet" block onClick={signIn}>
          {t("keep.button")}
        </Button>
      ) : outcome === "saved" ? (
        <Notice variant="info">{t("keep.saved")}</Notice>
      ) : (
        <Notice variant="error" action={{ label: t("try_again"), onClick: retry }}>
          {t("keep.failed")}
        </Notice>
      )}
    </div>
  );
}
