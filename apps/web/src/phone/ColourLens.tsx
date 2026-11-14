import { KeepMyColours } from "../auth/KeepMyColours";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button, Notice, Ring } from "../components";
import { HOLD_MS, ROTATION_MAX_DPS, initialHold, isHolding, stepHold } from "../colour/hold";
import { colourName } from "../colour/names";
import { LANG, siteName, t } from "../i18n/t";
import { GALLERY_ID, createPaneSender, sendPane, toPaneIn, type PaneStatus } from "../colour/panes";
import type { Reading } from "../colour/reading";
import { openRearCamera, stopCamera, type CameraResult } from "../sensors/camera";
import { useLensReading } from "../sensors/useLensReading";
import { useRotationRate } from "../sensors/useRotationRate";
import type { PhoneSite } from "../sites/sites";
import styles from "./ColourLens.module.css";
import { nextEmptySlot, type WindowPanes } from "./panes";
import { RoseWindow, slotCentre } from "./RoseWindow";
import { TopBar } from "./TopBar";

export const PRIVACY_LINE_MS = 5000;
export const CONNECTION_NOTICE_MS = 3000;
const FLARE_MS = 3400;
const FLARE_REDUCED_MS = 600;
// Remembers the privacy line for this page load; no storage.
let privacyShown = false;

const lensSize = () => Math.min(0.72 * window.innerWidth, 300);

type Props = {
  site: PhoneSite;
  remote: boolean;
  demo: boolean;
  camera: Promise<CameraResult>;
  onBack: () => void;
  onReading?: (reading: Reading) => void;
  onCaught?: (reading: Reading) => void;
  onComplete?: () => void;
  onSayWhy?: () => void;
  panes: WindowPanes;
  addPane: (pane: { windowId: string; slot: number; hex: string }) => void;
};

/** DESIGN.md 6.11 and 7.5: holding, caught, sending. The lens plays no sound. */
export function ColourLens({ site, remote, demo, camera, onBack, onReading, onCaught, onComplete, onSayWhy, panes, addPane }: Props) {
  const [cam, setCam] = useState(camera);
  const [result, setResult] = useState<CameraResult | null>(null);
  const [stopped, setStopped] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [ring, setRing] = useState(() => lensSize() + 20);
  const [privacy, setPrivacy] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const rotation = useRotationRate();
  const [hold, setHold] = useState(initialHold);
  const [everHeld, setEverHeld] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [caught, setCaught] = useState<Reading | null>(null);
  const [landed, setLanded] = useState(false);
  const [flight, setFlight] = useState<CSSProperties>({});
  const [status, setStatus] = useState<PaneStatus | null>(null);
  const [offlineShown, setOfflineShown] = useState(false);
  const [flare, setFlare] = useState(false);
  const lensRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const sender = useRef<ReturnType<typeof createPaneSender> | null>(null);
  const name = siteName(site);
  const where = remote ? t("lens.gallery") : name;

  useEffect(() => {
    let live = true;
    cam.then((r) => {
      if (!live) {
        // left before the camera answered
        if (r.status === "ready") stopCamera(r.stream);
        return;
      }
      stream.current = r.status === "ready" ? r.stream : null;
      setResult(r);
    });
    return () => {
      live = false;
      if (stream.current) stopCamera(stream.current);
      stream.current = null;
    };
  }, [cam]);

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden || !stream.current) return;
      stopCamera(stream.current);
      stream.current = null;
      setStopped(true);
    };
    const onResize = () => setRing(lensSize() + 20);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const ready = result?.status === "ready" && !stopped;
  useEffect(() => {
    if (video && result?.status === "ready" && !stopped) video.srcObject = result.stream;
  }, [video, result, stopped]);

  const reading = useLensReading(video, ready && hasData && !caught);
  useEffect(() => {
    if (!reading || caught) return;
    onReading?.(reading);
    const rate = rotation.current;
    setSpinning(rate !== null && rate > ROTATION_MAX_DPS);
    const next = stepHold(hold, { reading, rotation: rate, at: performance.now() });
    setHold(next);
    if (next.startedAt !== null) setEverHeld(true);
    if (!next.caught) return;
    // caught once: freeze the colour and send it
    const colour = next.first ?? reading; // the hold's first reading is the caught colour
    setCaught(colour);
    // the flight aims at the slot the server is most likely to give
    const lens = lensRef.current?.getBoundingClientRect();
    const mini = miniRef.current?.firstElementChild?.getBoundingClientRect();
    if (lens && mini) {
      const slot = slotCentre(nextEmptySlot(panes) ?? 0);
      const k = mini.width / slot.unit;
      setFlight({
        "--fx": `${mini.left + mini.width / 2 + slot.x * k - (lens.left + lens.width / 2)}px`,
        "--fy": `${mini.top + mini.height / 2 + slot.y * k - (lens.top + lens.height / 2)}px`,
      } as CSSProperties);
    }
    navigator.vibrate?.([40]);
    onCaught?.(colour);
    sender.current ??= createPaneSender({ send: sendPane, onStatus: setStatus });
    sender.current.submit(toPaneIn(colour, remote ? GALLERY_ID : site.id, new Date()));
  }, [reading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => sender.current?.stop(), []);

  // the server's slot wins over the predicted one
  useEffect(() => {
    if (status?.state !== "sent" || !caught) return;
    const { windowId, slot, completed } = status.accepted;
    addPane({ windowId, slot, hex: caught.hex });
    if (!completed) return;
    navigator.vibrate?.([40, 60, 40]);
    onComplete?.();
    setFlare(true);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => setFlare(false), reduced ? FLARE_REDUCED_MS : FLARE_MS);
    return () => clearTimeout(t);
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // the sender repeats `waiting` with a new object every retry, so key on the boolean
  const waitingOffline = status?.state === "waiting" && status.offline;
  useEffect(() => {
    setOfflineShown(false);
    if (!waitingOffline) return;
    const t = setTimeout(() => setOfflineShown(true), CONNECTION_NOTICE_MS);
    return () => clearTimeout(t);
  }, [waitingOffline]);

  const inReading = ready && hasData;
  useEffect(() => {
    if (!inReading || privacyShown) return;
    privacyShown = true;
    setPrivacy(true);
    const t = setTimeout(() => setPrivacy(false), PRIVACY_LINE_MS);
    return () => clearTimeout(t);
  }, [inReading]);

  const retry = () => {
    setResult(null);
    setStopped(false);
    setHasData(false);
    setHold(initialHold); // a hold from before the camera stopped must not carry over
    setEverHeld(false);
    setSpinning(false);
    setCam(openRearCamera());
  };
  const failed = result?.status === "denied" || result?.status === "unavailable";
  const shown = caught ?? reading;
  // once caught, the caught view stays whether or not the camera is live
  const showCaught = inReading || !!caught;

  return (
    <div className={styles.view}>
      <TopBar siteName={name} onBack={onBack} demo={demo} />
      {ready && <video ref={setVideo} className={styles.camera} autoPlay muted playsInline onLoadedData={() => setHasData(true)} />}
      <div className={styles.scrim} />
      <div className={styles.top} ref={miniRef}>
        <RoseWindow name={where} size="s" filled={panes.filled} flare={flare} />
      </div>
      <div
        ref={lensRef}
        className={`${styles.lens} ${inReading ? "" : styles.empty} ${status?.state === "rate_limited" ? styles.limited : ""}`}
      >
        {showCaught && !landed && (
          <div
            className={`${styles.disk} ${caught ? styles.caught : ""}`}
            style={{ backgroundColor: shown?.hex, ...flight }}
            onAnimationEnd={(e) => {
              if (/flight|fade/.test(e.animationName)) setLanded(true);
            }}
          />
        )}
        {!showCaught && !failed && <span className={styles.spinner} aria-hidden="true" />}
        {showCaught && status?.state !== "rate_limited" && (
          <div className={styles.ring}>
            {caught ? (
              <Ring progress={1} size={ring} label={t("lens.caught_label")} />
            ) : isHolding(hold) ? (
              <Ring filling holdMs={HOLD_MS} progress={1} size={ring} label={t("lens.hold")} />
            ) : (
              <Ring progress={0} size={ring} label={t("lens.hold")} />
            )}
          </div>
        )}
      </div>
      <div className={styles.sr} role="status">
        {status?.state === "sent" && t("lens.sr_caught", { count: status.accepted.count, where })}
      </div>
      <div className={styles.column}>
      <div className={styles.below}>
        {showCaught ? (
          <>
            {caught ? (
              <CaughtLines status={status} where={where} remote={remote} offlineShown={offlineShown} />
            ) : (
              <p className={styles.line}>{t(everHeld && !spinning ? "lens.hold" : "lens.point")}</p>
            )}
            {!caught && privacy && <p className={styles.privacy}>{t("lens.privacy")}</p>}
            {shown && (
              <span className={`${styles.reading} ${caught ? styles.readingCaught : ""}`}>
                <span className={styles.swatch} style={{ backgroundColor: shown.hex }} />
                {colourName(shown.bin, LANG)}
              </span>
            )}
          </>
        ) : result?.status === "denied" ? (
          <p className={styles.line}>{t("lens.denied")}</p>
        ) : result?.status === "unavailable" ? (
          <p className={styles.line}>{t("lens.unavailable")}</p>
        ) : (
          <p className={styles.line}>{t("lens.starting")}</p>
        )}
      </div>
      <div className={styles.bottom}>
        {!caught && (result?.status === "denied" || stopped) && (
          <Button variant="secondary" size="l" block onClick={retry}>
            {t("try_again")}
          </Button>
        )}
        {onSayWhy && status?.state === "sent" && (
          <Button variant="secondary" size="l" block onClick={onSayWhy}>
            {t("lens.say_why")}
          </Button>
        )}
        {status?.state === "sent" && <KeepMyColours />}
        <Button variant={caught ? "primary" : "secondary"} size="l" block onClick={onBack}>{t("back_to", { name })}</Button>
      </div>
      </div>
    </div>
  );
}

function CaughtLines({ status, where, remote, offlineShown }: { status: PaneStatus | null; where: string; remote: boolean; offlineShown: boolean }) {
  switch (status?.state) {
    case "sending":
      return <p className={styles.line}>{t("lens.sending")}</p>;
    case "sent":
      return (
        <p className={styles.line}>
          {status.accepted.completed
            ? t("lens.completed")
            : remote
              ? t("lens.in_gallery")
              : t("lens.in_window", { where, count: status.accepted.count })}
        </p>
      );
    case "waiting":
      return status.offline ? (
        <>
          <p className={styles.line}>{t("lens.saved")}</p>
          {offlineShown && (
            <Notice variant="connection">{t("lens.offline")}</Notice>
          )}
        </>
      ) : (
        <Notice variant="error">{t("lens.not_sent")}</Notice>
      );
    case "rate_limited":
      return <p className={styles.line}>{t("lens.rate_limited")}</p>;
    default:
      return null;
  }
}
