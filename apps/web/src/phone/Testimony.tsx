import { useEffect, useRef, useState } from "react";
import { Button } from "../components";
import { t } from "../i18n/t";
import { formatClock, type Testimony as Item } from "../memorial/testimonies";
import styles from "./Testimony.module.css";

type State = "idle" | "loading" | "playing" | "paused" | "ended" | "error";

/** One testimony (DESIGN.md 6.23). `active` is false once another item starts, which pauses this one. */
export function Testimony({ item, active, onStart, onStop }: { item: Item; active: boolean; onStart: () => void; onStop: () => void }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<State>(item.audio === null ? "error" : "idle");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!active && (state === "playing" || state === "loading")) audio.current?.pause();
  }, [active, state]);

  useEffect(() => () => audio.current?.pause(), []);

  const make = (src: string) => {
    const a = new Audio(src);
    a.addEventListener("playing", () => setState("playing"));
    a.addEventListener("pause", () => {
      if (a.ended) return;
      setState("paused");
      onStop();
    });
    a.addEventListener("ended", () => {
      setState("ended");
      onStop();
    });
    a.addEventListener("error", () => {
      setState("error");
      onStop();
    });
    a.addEventListener("timeupdate", () => setElapsed(a.currentTime));
    a.addEventListener("durationchange", () => setDuration(Number.isFinite(a.duration) ? a.duration : null));
    return a;
  };

  const tap = () => {
    if (state === "playing" || state === "loading") {
      audio.current?.pause();
      return;
    }
    if (item.audio === null) return;
    audio.current ??= make(item.audio);
    setState("loading");
    onStart();
    // play() runs inside the tap, before any await
    audio.current.play().catch((e: unknown) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setState("error");
      onStop();
    });
  };

  const busy = state === "loading";
  const playing = state === "playing";
  const showText = state !== "idle" && state !== "loading";
  return (
    <li className={styles.item}>
      <div className={styles.head}>
        <Button
          variant="icon"
          icon={playing ? "pause" : "play"}
          loading={busy}
          disabled={item.audio === null}
          aria-label={t(playing ? "testimony.pause" : "testimony.play", { title: item.title })}
          onClick={tap}
        />
        <div className={styles.words}>
          <p className={styles.title}>{item.title}</p>
          <p className={styles.meta}>
            {busy ? t("testimony.loading") : duration === null ? t("testimony.meta_pending") : t("testimony.meta", { duration: formatClock(duration) })}
          </p>
        </div>
      </div>
      <p className={styles.source}>{t("testimony.source", { source: item.source })}</p>
      {(playing || state === "paused") && duration !== null && (
        <p className={styles.clock}>
          {formatClock(elapsed)} / {formatClock(duration)}
        </p>
      )}
      {state === "error" && <p className={styles.error}>{t("testimony.error")}</p>}
      {showText && <p className={styles.text}>{item.text}</p>}
    </li>
  );
}
