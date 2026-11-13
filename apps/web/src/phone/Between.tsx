import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { getAudioContext, unlockAudio } from "../audio/context";
import { Button, Notice } from "../components";
import { track } from "../events";
import { bearingDeg, haversineM } from "../geo/geo";
import { MAX_ACCURACY_M, type Fix } from "../geo/geofence";
import { hasArrived } from "../nav/arrival";
import { appleMapsUrl, googleMapsUrl, isIPhone } from "../nav/maps";
import { suggestNext } from "../nav/score";
import { visitedSites } from "../nav/visited";
import { readDemo } from "../sensors/demo";
import type { PrimerResult } from "../sensors/primer";
import { useCompass } from "../sensors/useCompass";
import { useGeofence } from "../sensors/useGeofence";
import { useGeolocation } from "../sensors/useGeolocation";
import { findSite, SITES, type PhoneSite } from "../sites/sites";
import styles from "./Between.module.css";
import { CompassCard } from "./CompassCard";
import { DemoBadge } from "./DemoBadge";
import { TopBar } from "./TopBar";
import { useCityGlow } from "./useCityGlow";

type BetweenProps = {
  from: PhoneSite | null; // the site just left; null on "/"
  primer: PrimerResult;
  demo: boolean;
  remote: boolean;
  onBack?: () => void; // absent on "/"
  onTarget?: (siteId: string) => void; // Patrick: the beacon follows the chosen site
  onArrive?: (siteId: string) => void; // Patrick: the arrival chime; never called for the memorial
};

const open = (url: string) => window.open(url, "_blank", "noopener");

/** Between sites (DESIGN.md 7.8). */
export function Between({ from, primer, demo, onBack, onTarget, onArrive }: BetweenProps) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const injected = demo ? readDemo(search, from?.id) : null;
  const { position, status } = useGeolocation(injected);
  const { heading } = useCompass(injected && new URLSearchParams(search).has("heading") ? injected : null);
  const fence = useGeofence(position, from?.id);
  const city = useCityGlow();

  // The last fix good enough for distance, bearing and score.
  const good = useRef<Fix | null>(null);
  if (position && position.accuracy <= MAX_ACCURACY_M) good.current = position;
  const here = good.current;

  const [targetId] = useState<string | null>(null); // B3-2.c.1 adds the setter for a site picked in the list
  const next = useMemo(
    () => suggestNext({ sites: SITES, position: here, glow: city.glow, visited: visitedSites() }),
    [here, city.glow],
  );
  const shown = (targetId ? findSite(targetId) : next.suggestion?.site) ?? null;
  const shownId = shown?.id ?? null;

  useEffect(() => {
    if (shownId) onTarget?.(shownId);
  }, [shownId]); // eslint-disable-line react-hooks/exhaustive-deps

  const arrivedOnce = useRef(false);
  const arrived = shown !== null && hasArrived(fence, shown.id, from?.id ?? null);
  useEffect(() => {
    if (!arrived || !shown || arrivedOnce.current) return;
    arrivedOnce.current = true;
    if (!shown.is_memorial) {
      track("arrived", shown.id);
      navigator.vibrate?.([30, 60, 30]);
      onArrive?.(shown.id);
    }
    navigate(`/s/${shown.id}${search}`, { state: { ...primer, arrived: true } });
  }, [arrived]); // eslint-disable-line react-hooks/exhaustive-deps

  // Back from another app: the AudioContext may have been suspended.
  const [audioOff, setAudioOff] = useState(false);
  useEffect(() => {
    const ctx = getAudioContext();
    const check = () => document.visibilityState === "visible" && setAudioOff(ctx.state !== "running");
    const onState = () => ctx.state === "running" && setAudioOff(false);
    document.addEventListener("visibilitychange", check);
    ctx.addEventListener("statechange", onState);
    return () => {
      document.removeEventListener("visibilitychange", check);
      ctx.removeEventListener("statechange", onState);
    };
  }, []);

  const [choose, setChoose] = useState(false);
  const iphone = isIPhone(navigator.userAgent);

  return (
    <main className={styles.page}>
      {from && onBack ? (
        <TopBar siteName={from.name} onBack={onBack} demo={demo} />
      ) : (
        <div className={styles.top}>{demo && <DemoBadge />}</div>
      )}
      {audioOff && (
        <div className={styles.notice}>
          <Notice variant="info" icon="headphones">
            <Button variant="quiet" onClick={async () => setAudioOff((await unlockAudio()) === "blocked")}>
              Tap to listen again
            </Button>
          </Notice>
        </div>
      )}
      <div className={styles.centre}>
        {shown && (
          <CompassCard
            site={shown}
            distanceM={here ? haversineM(here, shown) : null}
            bearing={here ? bearingDeg(here, shown) : null}
            heading={heading}
            weak={position !== null && position.accuracy > MAX_ACCURACY_M}
            locationOff={status === "denied" || status === "unavailable"}
            glow={city.glow?.[shown.id] ?? null}
            connected={city.connected}
            allVisited={next.allVisited}
          />
        )}
      </div>
      <div className={styles.actions}>
        {choose ? (
          <>
            <div className={styles.close}>
              <Button variant="icon" icon="close" aria-label="Close" onClick={() => setChoose(false)} />
            </div>
            <Button variant="secondary" size="l" block onClick={() => shown && open(appleMapsUrl(shown))}>Apple Maps</Button>
            <Button variant="secondary" size="l" block onClick={() => shown && open(googleMapsUrl(shown))}>Google Maps</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="l" block>Sites</Button>
            <Button
              variant="secondary"
              size="l"
              block
              onClick={() => (iphone ? setChoose(true) : shown && open(googleMapsUrl(shown)))}
            >
              Open in Maps
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
