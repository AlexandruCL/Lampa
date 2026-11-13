import { useEffect, useRef, useState } from "react";
import { Button, Ring } from "../components";
import { colourName } from "../colour/names";
import type { Reading } from "../colour/reading";
import { openRearCamera, stopCamera, type CameraResult } from "../sensors/camera";
import { useLensReading } from "../sensors/useLensReading";
import type { PhoneSite } from "../sites/sites";
import styles from "./ColourLens.module.css";
import { RoseWindow } from "./RoseWindow";
import { TopBar } from "./TopBar";

export const PRIVACY_LINE_MS = 5000;
const EMPTY_PANES: null[] = Array(48).fill(null);
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
};

/** DESIGN.md 6.11 and 7.5, up to the holding state. The lens plays no sound. */
export function ColourLens({ site, remote, demo, camera, onBack, onReading }: Props) {
  const [cam, setCam] = useState(camera);
  const [result, setResult] = useState<CameraResult | null>(null);
  const [stopped, setStopped] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [ring, setRing] = useState(() => lensSize() + 20);
  const [privacy, setPrivacy] = useState(false);
  const stream = useRef<MediaStream | null>(null);

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

  const reading = useLensReading(video, ready && hasData);
  useEffect(() => {
    if (reading) onReading?.(reading);
  }, [reading]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setCam(openRearCamera());
  };
  const failed = result?.status === "denied" || result?.status === "unavailable";

  return (
    <div className={styles.view}>
      <TopBar siteName={site.name} onBack={onBack} demo={demo} />
      {ready && <video ref={setVideo} className={styles.camera} autoPlay muted playsInline onLoadedData={() => setHasData(true)} />}
      <div className={styles.scrim} />
      <div className={styles.top}>
        <RoseWindow name={remote ? "Gallery" : site.name} size="s" filled={EMPTY_PANES} />
      </div>
      <div className={`${styles.lens} ${inReading ? "" : styles.empty}`}>
        {inReading && <div className={styles.disk} style={{ backgroundColor: reading?.hex }} />}
        {!inReading && !failed && <span className={styles.spinner} aria-hidden="true" />}
        {inReading && (
          <div className={styles.ring}>
            <Ring progress={0} size={ring} label="Hold still" />
          </div>
        )}
      </div>
      <div className={styles.below}>
        {inReading ? (
          <>
            <p className={styles.line}>Point at a colour and hold still</p>
            {privacy && <p className={styles.privacy}>Only the colour leaves your phone, never the picture.</p>}
            {reading && (
              <span className={styles.reading}>
                <span className={styles.swatch} style={{ backgroundColor: reading.hex }} />
                {colourName(reading.bin)}
              </span>
            )}
          </>
        ) : result?.status === "denied" ? (
          <p className={styles.line}>LAMPA needs the camera to read a colour. Only the colour leaves your phone. Allow the camera in your browser settings, then try again.</p>
        ) : result?.status === "unavailable" ? (
          <p className={styles.line}>This device has no camera we can use. Try on your phone.</p>
        ) : (
          <p className={styles.line}>Starting the camera</p>
        )}
      </div>
      <div className={styles.bottom}>
        {(result?.status === "denied" || stopped) && (
          <Button variant="secondary" size="l" block onClick={retry}>
            Try again
          </Button>
        )}
        <Button variant="secondary" size="l" block onClick={onBack}>{`Back to ${site.name}`}</Button>
      </div>
    </div>
  );
}
