import type { PendingEcho } from "@lampa/shared";
import { useEffect, useState, type Ref } from "react";
import { Button } from "../components";
import { authBlob } from "../auth/authApi";
import { formatDuration, metaLine, siteName } from "./queue";
import styles from "./EchoDetail.module.css";

type Props = {
  echo: PendingEcho;
  now: number;
  getToken: () => Promise<string>;
  busy: "approve" | "reject" | null;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
  headingRef: Ref<HTMLHeadingElement>;
};

/** Mount it with key={echo.id}: a new echo gets a fresh audio URL, duration and error state. */
export function EchoDetail({ echo, now, getToken, busy, onApprove, onReject, onBack, headingRef }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    let url: string | null = null;
    getToken()
      .then((token) => authBlob(echo.audioUrl, token))
      .then((blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [echo.audioUrl, getToken]);

  const facts = [duration !== null && formatDuration(duration), metaLine(echo, now)].filter(Boolean).join(", ");

  return (
    <section className={styles.consoleDetail} aria-labelledby={`echo-${echo.id}`}>
      <span className={styles.back}>
        <Button variant="quiet" onClick={onBack}>
          Back to the queue
        </Button>
      </span>
      <div className={styles.consoleDetailHead}>
        <h2 id={`echo-${echo.id}`} className={styles.consoleSite} tabIndex={-1} ref={headingRef}>
          {siteName(echo.siteId)}
        </h2>
        <p className={styles.consoleFacts}>{facts}</p>
      </div>

      {failed ? (
        <p className={styles.audioPlayerError}>
          Could not play this echo.
          {src && (
            <a className={styles.quietLink} href={src} download>
              Download it
            </a>
          )}
        </p>
      ) : (
        <div className={styles.audioPlayer}>
          <audio
            className={styles.audio}
            controls
            src={src ?? undefined}
            aria-disabled={src ? undefined : "true"}
            onLoadedMetadata={(e) => {
              const d = e.currentTarget.duration;
              if (Number.isFinite(d)) setDuration(d);
            }}
            onError={() => src && setFailed(true)}
          />
          {!src && <span className={styles.audioPlayerTime}>Loading audio</span>}
        </div>
      )}

      {echo.transcript ? (
        <p className={styles.consoleTranscript} lang={echo.lang ?? undefined}>
          {echo.transcript}
        </p>
      ) : (
        <p className={styles.consoleMuted}>No transcript yet. Listen to the recording.</p>
      )}

      <p className={styles.consoleConsent}>The visitor agreed to public playback in their own voice.</p>

      <div className={styles.consoleActions}>
        <Button variant="primary" loading={busy === "approve"} disabled={busy === "reject"} onClick={onApprove}>
          {busy === "approve" ? "Approving" : "Approve"}
        </Button>
        <Button variant="danger" loading={busy === "reject"} disabled={busy === "approve"} onClick={onReject}>
          Reject
        </Button>
      </div>
    </section>
  );
}
