import { useEffect, useRef, useState } from "react";
import { Button, Ring } from "../components";
import { siteName, t } from "../i18n/t";
import { PAINT_MS, startTrail } from "../paint/stack";
import { openRearCamera, stopCamera, type CameraResult } from "../sensors/camera";
import type { PhoneSite } from "../sites/sites";
import styles from "./PaintLight.module.css";
import { TopBar } from "./TopBar";

type Props = { site: PhoneSite; demo: boolean; camera: Promise<CameraResult>; onBack: () => void };

/** Paint with light: a dot in the centre of the camera view leaves a trail on the scene as the phone turns, for PAINT_MS. The picture stays on the phone. */
export function PaintLight({ site, demo, camera, onBack }: Props) {
  const [cam, setCam] = useState(camera);
  const [result, setResult] = useState<CameraResult | null>(null);
  const [stopped, setStopped] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stack = useRef<ReturnType<typeof startTrail> | null>(null);
  const [noMotion, setNoMotion] = useState(false);
  const [progress, setProgress] = useState<number | null>(null); // null while not painting
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const name = siteName(site);

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
      stack.current?.stop(); // what is painted so far becomes the picture
      stopCamera(stream.current);
      stream.current = null;
      setStopped(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stack.current?.stop();
    };
  }, []);

  const live = result?.status === "ready" && !stopped;
  useEffect(() => {
    if (video && result?.status === "ready" && !stopped) video.srcObject = result.stream;
  }, [video, result, stopped]);

  useEffect(() => {
    if (!blob) return;
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => {
      URL.revokeObjectURL(u);
      setUrl(null);
    };
  }, [blob]);

  const paint = async () => {
    // iOS gives motion only after asking inside a tap; once granted it does not ask again
    const DME = (window as { DeviceMotionEvent?: { requestPermission?: () => Promise<string> } }).DeviceMotionEvent;
    if (typeof DME?.requestPermission === "function") await DME.requestPermission().catch(() => {});
    if (!video || !canvas.current) return;
    setNoMotion(false);
    setProgress(0);
    // refused or missing motion is not an error here: the finger still paints, and the screen says so
    const s = startTrail(video, canvas.current, PAINT_MS, setProgress, () => setNoMotion(true));
    stack.current = s;
    s.done
      .then(setBlob, () => {})
      .finally(() => {
        if (stack.current !== s) return;
        stack.current = null;
        setProgress(null);
      });
  };

  const save = () => {
    if (!blob || !url) return;
    const file = new File([blob], `lampa-${site.id}.jpg`, { type: "image/jpeg" });
    const download = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
    };
    if (!navigator.canShare?.({ files: [file] })) return download();
    // share inside the tap; a cancelled share keeps the picture on screen
    navigator.share({ files: [file] }).catch((e: unknown) => {
      if ((e as { name?: unknown } | null)?.name !== "AbortError") download();
    });
  };

  const retry = () => {
    setResult(null);
    setStopped(false);
    setHasData(false);
    setCam(openRearCamera());
  };

  const painting = progress !== null;
  const ready = live && hasData;
  const secondsLeft = Math.ceil(((1 - (progress ?? 0)) * PAINT_MS) / 1000);

  return (
    <div className={styles.view}>
      <TopBar siteName={name} onBack={onBack} demo={demo} />
      {live && <video ref={setVideo} className={styles.media} autoPlay muted playsInline onLoadedData={() => setHasData(true)} />}
      <canvas ref={canvas} className={styles.media} hidden={!painting} />
      {ready && !painting && !url && !noMotion && <div className={styles.dot} aria-hidden />}
      {url && <img className={styles.result} src={url} alt={t("paint.alt", { name })} />}
      <div className={styles.panel}>
        <div className={styles.lines} role="status">
          {url ? null : painting ? (
            <>
              <div className={styles.timer}>
                <Ring progress={progress} size={56} label={t("paint.painting")} />
                <p className={styles.line}>{t("paint.left", { seconds: secondsLeft })}</p>
              </div>
              {noMotion && <p className={styles.line}>{t("paint.no_motion")}</p>}
            </>
          ) : ready ? (
            <>
              <p className={styles.line}>{t(noMotion ? "paint.no_motion" : "paint.hint")}</p>
              <p className={styles.meta}>{t("paint.privacy")}</p>
            </>
          ) : result?.status === "denied" ? (
            <p className={styles.line}>{t("paint.denied")}</p>
          ) : result?.status === "unavailable" ? (
            <p className={styles.line}>{t("lens.unavailable")}</p>
          ) : stopped ? null : (
            <p className={styles.line}>{t("lens.starting")}</p>
          )}
        </div>
        {url ? (
          <>
            <Button variant="primary" size="l" block onClick={save}>
              {t("paint.save")}
            </Button>
            {live && (
              <Button variant="secondary" size="l" block onClick={() => setBlob(null)}>
                {t("paint.again")}
              </Button>
            )}
          </>
        ) : (
          ready &&
          !painting && (
            <Button variant="primary" size="l" block onClick={paint}>
              {t("paint.start")}
            </Button>
          )
        )}
        {painting && !url && (
          <Button variant="secondary" size="l" block onClick={() => stack.current?.stop()}>
            {t("paint.stop")}
          </Button>
        )}
        {!url && (result?.status === "denied" || stopped) && (
          <Button variant="secondary" size="l" block onClick={retry}>
            {t("try_again")}
          </Button>
        )}
        {!painting && (
          <Button variant="secondary" size="l" block onClick={onBack}>
            {t("back_to", { name })}
          </Button>
        )}
      </div>
    </div>
  );
}
