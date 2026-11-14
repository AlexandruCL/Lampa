import type { BellMessage, BellTower, HarmonyMessage } from "@lampa/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { harmonyChord, preloadBells, ringBell } from "../bells/bellSound";
import { createFlickDetector } from "../bells/flick";
import { postRing } from "../bells/ring";
import { Button } from "../components";
import { siteName, t } from "../i18n/t";
import type { CompassStatus } from "../sensors/primer";
import { useRotationRate } from "../sensors/useRotationRate";
import type { PhoneSite } from "../sites/sites";
import { getClockOffset } from "../time/clockOffset";
import styles from "./Bells.module.css";
import { TopBar } from "./TopBar";

const HARMONY_LINE_MS = 6000; // about as long as the peal is heard

type Props = {
  site: PhoneSite;
  demo: boolean;
  /** null while the motion prompt is open. Tapping rings whatever the answer. */
  motion: CompassStatus | null;
  /** The last `bell` and `harmony` of this site from the live socket. */
  bell: BellMessage | null;
  harmony: HarmonyMessage | null;
  onBack: () => void;
};

/** The Dialogue of the Bells: this phone is one bell of one tower, rung by a flick or a tap. */
export function Bells({ site, demo, motion, bell, harmony, onBack }: Props) {
  const [tower, setTower] = useState<BellTower | null>(null);
  const [struck, setStruck] = useState(0); // counts restart the CSS animations through `key`
  const [answered, setAnswered] = useState(0);
  const [together, setTogether] = useState(0);
  const [chord, setChord] = useState(false);
  const offset = useRef(0);
  const rate = useRotationRate();
  const name = siteName(site);

  useEffect(() => {
    preloadBells();
    // Five pings, once; until they answer, and when they all fail, the phone clock is used as it is.
    void getClockOffset().then((o) => (offset.current = o ?? 0));
  }, []);

  const ring = useCallback(() => {
    if (!tower) return;
    ringBell(tower);
    postRing({ siteId: site.id, tower, at: Date.now() + offset.current });
    setStruck((n) => n + 1);
  }, [tower, site.id]);

  useEffect(() => {
    if (!tower) return;
    const flick = createFlickDetector();
    let frame = requestAnimationFrame(function read(now) {
      if (rate.current !== null && flick(rate.current, now)) ring();
      frame = requestAnimationFrame(read);
    });
    return () => cancelAnimationFrame(frame);
  }, [tower, ring, rate]);

  // A message that arrived before this view opened is not played.
  const seenBell = useRef(bell);
  useEffect(() => {
    if (bell === seenBell.current) return;
    seenBell.current = bell;
    // The other tower is heard through the air, so it only shows; our own ring comes back too and is skipped.
    if (bell && tower && bell.tower !== tower) setAnswered((n) => n + 1);
  }, [bell, tower]);

  const seenHarmony = useRef(harmony);
  useEffect(() => {
    if (harmony === seenHarmony.current) return;
    seenHarmony.current = harmony;
    harmonyChord();
    navigator.vibrate?.([60, 80, 60, 80, 200]);
    setTogether((n) => n + 1);
    setChord(true);
    const timer = setTimeout(() => setChord(false), HARMONY_LINE_MS);
    return () => clearTimeout(timer);
  }, [harmony]);

  return (
    <div className={styles.view}>
      <TopBar siteName={name} onBack={onBack} demo={demo} />
      {together > 0 && <div key={together} className={styles.glow} aria-hidden="true" />}
      <div className={styles.body}>
        {tower ? (
          <>
            {/* The harmony takes the title, the largest text on the screen. */}
            <h1 className={styles.title} aria-live="polite">
              {chord ? t("bells.harmony") : t(`bells.${tower}`)}
            </h1>
            <button type="button" className={styles.bell} onClick={ring} aria-label={t("bells.ring")}>
              {answered > 0 && <span key={`a${answered}`} className={styles.answer} aria-hidden="true" />}
              <span key={struck} className={struck > 0 ? styles.struck : undefined} aria-hidden="true" />
            </button>
            <p className={styles.line} role="status">
              {chord || motion === null ? "" : motion === "granted" ? t("bells.flick") : t("bells.tap")}
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.title}>{t("bells.pick")}</h1>
            <p className={styles.line}>{t("bells.pick_hint")}</p>
            <Button variant="primary" size="l" block onClick={() => setTower("catholic")}>
              {t("bells.catholic")}
            </Button>
            <Button variant="primary" size="l" block onClick={() => setTower("serbian")}>
              {t("bells.serbian")}
            </Button>
          </>
        )}
      </div>
      <div className={styles.bottom}>
        {tower && (
          <Button variant="quiet" onClick={() => setTower(null)}>
            {t("bells.change")}
          </Button>
        )}
        <Button variant="secondary" size="l" block onClick={onBack}>
          {t("back_to", { name })}
        </Button>
      </div>
    </div>
  );
}
