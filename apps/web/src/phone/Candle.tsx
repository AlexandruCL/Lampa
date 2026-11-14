import { useEffect, useRef, useState } from "react";
import { Button, Ring } from "../components";
import { track } from "../events";
import { t } from "../i18n/t";
import { CANDLE_DEMO_HOLD_MS, CANDLE_HOLD_MS, CANDLE_TICK_MS, candleProgress, initialCandle, stepCandle } from "../memorial/candle";
import { useRotationRate } from "../sensors/useRotationRate";
import styles from "./Candle.module.css";

// In memory for this page load only: a candle already lit this load lets the next one be lit too (DESIGN.md 7.11).
let litThisLoad = false;

const BASE_Y = 106; // stem top, flame base: ring inner bottom edge 194, stem base 40 above, stem 48 tall

/** The candle (DESIGN.md 6.22): motion-only stillness, or a tap when the phone reports no motion. */
export function Candle({ siteId, demo }: { siteId: string; demo: boolean }) {
  const rate = useRotationRate();
  const litBefore = useRef(litThisLoad).current;
  const state = useRef(initialCandle(performance.now()));
  const [view, setView] = useState({ progress: 0, lit: false, fallback: false });
  const holdMs = demo ? CANDLE_DEMO_HOLD_MS : CANDLE_HOLD_MS;

  const light = () => {
    litThisLoad = true;
    track("candle", siteId);
  };

  useEffect(() => {
    const id = setInterval(() => {
      const at = performance.now();
      const was = state.current;
      const next = stepCandle(was, { rate: rate.current, at, holdMs });
      state.current = next;
      if (next.lit && !was.lit) light();
      const progress = candleProgress(next, at, holdMs);
      setView((v) => (v.progress === progress && v.lit === next.lit && v.fallback === next.fallback ? v : { progress, lit: next.lit, fallback: next.fallback }));
    }, CANDLE_TICK_MS);
    return () => clearInterval(id);
  }, [rate, holdMs]);

  const tapLight = () => {
    state.current = { ...state.current, lit: true, fallback: false };
    setView({ progress: 1, lit: true, fallback: false });
    light();
  };

  const scale = view.fallback ? 0.4 : 0.4 + 0.6 * view.progress;
  return (
    <div className={styles.candle}>
      {litBefore && !view.lit && <p className={styles.line}>{t("candle.lit")}</p>}
      <div className={styles.disc}>
        {!view.fallback && (
          <div className={styles.ring}>
            <Ring progress={view.progress} size={200} label={t("candle.label")} />
          </div>
        )}
        <svg className={styles.art} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
          <rect className={styles.stem} x="94" y="106" width="12" height="48" rx="2" />
          <path
            className={styles.flame}
            style={{ transform: `scale(${scale})`, transformOrigin: `100px ${BASE_Y}px`, opacity: scale }}
            d="M100 76C106 88 109 92 109 97A9 9 0 0 1 91 97C91 92 94 88 100 76Z"
          />
        </svg>
      </div>
      {view.fallback && !view.lit ? (
        <Button variant="secondary" size="l" onClick={tapLight}>
          {t("candle.tap")}
        </Button>
      ) : (
        <p className={styles.line} role="status">
          {view.lit ? t("candle.lit") : t("candle.ready")}
        </p>
      )}
    </div>
  );
}
