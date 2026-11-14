import { useAuth0 } from "@auth0/auth0-react";
import { PendingEchoes, type PendingEcho } from "@lampa/shared";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ApiError } from "../api/client";
import { authApi } from "../auth/authApi";
import { Button, Notice } from "../components";
import { AddPlace } from "./AddPlace";
import { EchoDetail } from "./EchoDetail";
import { clearVisitorReturn, keepSelection, metaLine, QUEUE_REFRESH_MS, removeEcho, sessionEnded, siteName } from "./queue";
import styles from "./CuratePage.module.css";

type Queue = { echoes: PendingEcho[]; selected: string | null };
type Action = "approve" | "reject";

const LOADING_ROWS = 3;
const narrow = () => window.matchMedia("(max-width: 1023px)").matches;

export function CuratePage() {
  const { isLoading, isAuthenticated, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  // The SDK types the token as optional (only cache-only mode leaves it unset); treat that as a failed fetch.
  const getToken = useCallback(async () => {
    const token = await getAccessTokenSilently();
    if (!token) throw new Error("No access token");
    return token;
  }, [getAccessTokenSilently]);

  const [queue, setQueue] = useState<Queue | null>(null);
  const [access, setAccess] = useState<"ok" | "forbidden" | "ended">("ok");
  const [notice, setNotice] = useState<{ variant: "info" | "error"; text: string; retry?: boolean } | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);
  const [open, setOpen] = useState(false);
  const [focusRow, setFocusRow] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const latest = useRef(0);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const [tab, setTab] = useState<"queue" | "place">("queue");
  const tabRef = useRef<HTMLButtonElement>(null);
  const placeTabRef = useRef<HTMLButtonElement>(null);
  const detailRef = useRef<HTMLHeadingElement>(null);

  const signIn = () => {
    clearVisitorReturn();
    return loginWithRedirect({
      authorizationParams: { redirect_uri: window.location.origin + "/curate" },
      appState: { returnTo: "/curate" },
    });
  };

  /** A background refresh (`quiet`) that fails keeps the last list without a Notice. */
  const load = useCallback(
    async (quiet = false) => {
      // Only the newest request lands, so a poll sent before an approve cannot bring its row back.
      const request = ++latest.current;
      try {
        const body = await authApi("/echoes?status=pending", await getToken(), PendingEchoes);
        if (request !== latest.current || !body) return;
        setQueue((q) => ({ echoes: body.echoes, selected: keepSelection(body.echoes, q?.selected ?? null) }));
        setNotice((n) => (n?.retry ? null : n));
        setNow(Date.now());
      } catch (err) {
        if (request !== latest.current) return;
        if (sessionEnded(err)) setAccess("ended");
        else if (err instanceof ApiError && err.status === 403) setAccess("forbidden");
        else if (!quiet) setNotice({ variant: "error", text: "Could not load the queue. Try again.", retry: true });
      }
    },
    [getToken],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
    const timer = setInterval(() => void load(true), QUEUE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, load]);

  useEffect(() => {
    if (!focusRow || !queue) return;
    setFocusRow(false);
    const row = queue.selected && rows.current.get(queue.selected);
    (row || tabRef.current)?.focus();
  }, [focusRow, queue]);

  useEffect(() => {
    if (open && narrow()) detailRef.current?.focus();
  }, [open]);

  const leave = (id: string) => {
    setQueue((q) => q && removeEcho(q.echoes, id, q.selected));
    setOpen(false);
    setFocusRow(true);
    void load(true);
  };

  const moderate = async (action: Action) => {
    const id = queue?.selected;
    if (!id || busy) return;
    setBusy(action);
    setNotice(null);
    try {
      await authApi(`/echoes/${encodeURIComponent(id)}/${action}`, await getToken(), undefined, { method: "POST" });
      leave(id);
      if (action === "approve") setNotice({ variant: "info", text: "Approved. It plays on the Living Map now." });
    } catch (err) {
      if (sessionEnded(err)) setAccess("ended");
      else if (err instanceof ApiError && err.status === 409) leave(id);
      else if (err instanceof ApiError && err.status === 403)
        setNotice({ variant: "error", text: "You do not have permission to moderate. Sign in again with your curator account." });
      else setNotice({ variant: "error", text: "That did not save. Try again." });
    } finally {
      setBusy(null);
    }
  };

  // Before the signed-out check: a failed token call can clear the SDK's user too.
  if (access === "ended") {
    return (
      <main className={styles.console}>
        <div className={styles.consoleNotice}>
          <Notice variant="error" action={{ label: "Sign in", onClick: signIn }}>
            Your session ended. Sign in again.
          </Notice>
        </div>
      </main>
    );
  }

  if (!isLoading && !isAuthenticated) {
    return (
      <main className={styles.console}>
        <div className={styles.consoleCenter}>
          <p className={styles.consoleWordmark}>LAMPA</p>
          <h1 className={styles.consoleTitle}>Curator console</h1>
          <p className={styles.consoleText}>Sign in with your curator account. Two-factor sign-in is required.</p>
          <Button variant="primary" size="l" onClick={signIn}>
            Sign in
          </Button>
        </div>
      </main>
    );
  }

  if (access === "forbidden") {
    return (
      <main className={styles.console}>
        <div className={styles.consoleCenter}>
          <p className={styles.consoleWordmark}>LAMPA</p>
          <h1 className={styles.consoleTitle}>Curator console</h1>
          <p className={styles.consoleText}>This account cannot curate. Ask the team to add the curator role.</p>
          <Button variant="quiet" onClick={() => logout({ logoutParams: { returnTo: window.location.origin + "/curate" } })}>
            Sign out
          </Button>
        </div>
      </main>
    );
  }

  const selected = queue?.echoes.find((e) => e.id === queue.selected);

  // Two tabs, so either arrow moves to the other one.
  const onTabKey = (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = tab === "queue" ? "place" : "queue";
    setTab(next);
    (next === "queue" ? tabRef : placeTabRef).current?.focus();
  };

  return (
    <main className={styles.console}>
      <div className={styles.consoleTabs} role="tablist" onKeyDown={onTabKey}>
        <button
          type="button"
          role="tab"
          id="curate-tab-queue"
          aria-controls="curate-panel-queue"
          aria-selected={tab === "queue"}
          tabIndex={tab === "queue" ? 0 : -1}
          className={styles.consoleTab}
          ref={tabRef}
          onClick={() => setTab("queue")}
        >
          {queue ? `Echo queue (${queue.echoes.length})` : "Echo queue"}
        </button>
        <button
          type="button"
          role="tab"
          id="curate-tab-place"
          aria-controls="curate-panel-place"
          aria-selected={tab === "place"}
          tabIndex={tab === "place" ? 0 : -1}
          className={styles.consoleTab}
          ref={placeTabRef}
          onClick={() => setTab("place")}
        >
          Add a place
        </button>
      </div>
      <div className={styles.panel} role="tabpanel" id="curate-panel-queue" aria-labelledby="curate-tab-queue" hidden={tab !== "queue"}>
        {notice && (
          <div className={styles.consoleNotice}>
            <Notice
              variant={notice.variant}
              action={notice.retry ? { label: "Try again", onClick: () => void load() } : undefined}
            >
              {notice.text}
            </Notice>
          </div>
        )}
        <div className={`${styles.consolePanes} ${open && selected ? styles.open : ""}`}>
          {!queue ? (
            !notice?.retry && <ul className={styles.consoleList} aria-busy="true">
              {Array.from({ length: LOADING_ROWS }, (_, i) => (
                <li key={i}>
                  <div className={`${styles.queueRow} ${styles.queueRowLoading}`}>
                    <span className={styles.queueRowSite}>Loading</span>
                    <span className={styles.queueRowMeta}>&nbsp;</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : queue.echoes.length === 0 ? (
            <p className={styles.consoleEmpty}>No echoes waiting. New ones appear here as visitors record them.</p>
          ) : (
            <ul className={styles.consoleList}>
              {queue.echoes.map((echo) => (
                <li key={echo.id}>
                  <button
                    type="button"
                    className={styles.queueRow}
                    aria-current={echo.id === queue.selected ? "true" : undefined}
                    ref={(el) => {
                      if (el) rows.current.set(echo.id, el);
                      else rows.current.delete(echo.id);
                    }}
                    onClick={() => {
                      setQueue((q) => q && { ...q, selected: echo.id });
                      setOpen(true);
                    }}
                  >
                    <span className={styles.queueRowSite}>{siteName(echo)}</span>
                    <span className={styles.queueRowMeta}>{metaLine(echo, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && (
            <div className={styles.detailPane}>
              <EchoDetail
                key={selected.id}
                echo={selected}
                now={now}
                getToken={getToken}
                busy={busy}
                onApprove={() => void moderate("approve")}
                onReject={() => void moderate("reject")}
                onBack={() => {
                  setOpen(false);
                  setFocusRow(true);
                }}
                headingRef={detailRef}
              />
            </div>
          )}
        </div>
      </div>
      {/* Kept mounted while hidden, so a typed form or a running publish survives a tab switch */}
      <div className={styles.panel} role="tabpanel" id="curate-panel-place" aria-labelledby="curate-tab-place" hidden={tab !== "place"}>
        <AddPlace getToken={getToken} onSessionEnded={() => setAccess("ended")} />
      </div>
    </main>
  );
}
