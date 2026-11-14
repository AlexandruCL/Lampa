import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";
import { Button, Notice } from "../components";
import { t } from "../i18n/t";
import { Sheet } from "../phone/Sheet";
import {
  CLAIM_RESULT_KEY,
  PROMPT_SEEN_KEY,
  SIGN_IN_RETURN_KEY,
  claimAnonymous,
  readSession,
  requireToken,
  shouldPromptKeep,
  writeSession,
} from "./claimFlow";
import styles from "./KeepMyColours.module.css";

type Outcome = "saved" | "failed";

function signIn(loginWithRedirect: ReturnType<typeof useAuth0>["loginWithRedirect"]) {
  const returnTo = location.pathname + location.search;
  // A cancelled sign-in brings no appState back, so ClaimOnReturn finds the page here.
  writeSession(SIGN_IN_RETURN_KEY, returnTo);
  void loginWithRedirect({ appState: { claim: true, returnTo } });
}

/** Asks a signed-out visitor to sign in before catching, once per site in a browser session (Cristea). KeepMyColours stays as the way in afterwards. */
export function KeepPrompt({ siteId }: { siteId: string }) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `${PROMPT_SEEN_KEY}.${siteId}`;
    if (!shouldPromptKeep({ isLoading, isAuthenticated, seen: readSession(key) })) return;
    writeSession(key, "1");
    setOpen(true);
  }, [isLoading, isAuthenticated, siteId]);

  if (!open || isAuthenticated) return null;
  return (
    <Sheet title={t("keep.prompt_title")} onClose={() => setOpen(false)}>
      <div className={styles.root}>
        <p className={styles.body}>{t("keep.prompt_body")}</p>
        <Button variant="primary" size="l" block onClick={() => signIn(loginWithRedirect)}>
          {t("keep.prompt_sign_in")}
        </Button>
      </div>
    </Sheet>
  );
}

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

  // The phone always sends its anonymous token, so what a signed-in visitor does is stored as anonymous.
  // This mounts on every Site view and after every catch: claim again, quietly. The claim only moves unclaimed rows.
  useEffect(() => {
    if (isAuthenticated) claimAnonymous(requireToken(getAccessTokenSilently)).catch(() => {});
  }, [isAuthenticated, getAccessTokenSilently]);

  if (isLoading || (isAuthenticated && !outcome)) return null;

  return (
    <div className={styles.root}>
      {!isAuthenticated ? (
        <Button variant="quiet" block onClick={() => signIn(loginWithRedirect)}>
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
