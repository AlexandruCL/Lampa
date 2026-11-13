import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { blendHeading } from "../sensors/heading";
import type { PrimerResult } from "../sensors/primer";
import { useCompass } from "../sensors/useCompass";
import { useGeofence } from "../sensors/useGeofence";
import { useGeolocation } from "../sensors/useGeolocation";
import { findSite, SITES, type PhoneSite } from "../sites/sites";
import styles from "./Between.module.css";
import { CompassCard } from "./CompassCard";
import { DemoBadge } from "./DemoBadge";
import { Sheet } from "./Sheet";
import { SitesList } from "./SitesList";
import { TopBar } from "./TopBar";
import { useCityGlow } from "./useCityGlow";

type BetweenProps = {
  from: PhoneSite | null; // the site just left; null on "/"
  primer: PrimerResult;
  demo: boolean;
  remote: boolean;
  notice?: ReactNode; // the location-denied Notice of 7.1
  onBack?: () => void; // absent on "/"
  onTarget?: (siteId: string) => void; // Patrick: the beacon follows the chosen site
  onArrive?: (siteId: string) => void; // Patrick: the arrival chime; never called for the memorial
};

const LANTERN_MS = 10000;

const open = (url: string) => window.open(url, "_blank", "noopener");

/** Between sites (DESIGN.md 7.8). */
export function Between({ from, primer, demo, remote, notice, onBack, onTarget, onArrive }: BetweenProps) {
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

  const [targetId, setTargetId] = useState<string | null>(null);
  const [list, setList] = useState(remote);
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
  const arrived = !remote && shown !== null && hasArrived(fence, shown.id, from?.id ?? null);
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

  // Lantern dim (6.12): idle for LANTERN_MS dims the view; the waking tap or key does nothing else.
  const [dim, setDim] = useState(false);
  const held = list || choose;
  useEffect(() => {
    if (held) return setDim(false);
    let dimmed = false;
    let swallow = false; // the click/keyup that follows a swallowed pointerdown/keydown
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setDim((dimmed = true)), LANTERN_MS);
    };
    const wake = (e: Event) => {
      if (dimmed) {
        e.stopPropagation();
        e.preventDefault();
        swallow = true;
        setDim((dimmed = false));
      }
      arm();
    };
    const eat = (e: Event) => {
      if (!swallow) return;
      swallow = false;
      e.stopPropagation();
      e.preventDefault();
    };
    const opts = { capture: true } as const;
    document.addEventListener("pointerdown", wake, opts);
    document.addEventListener("keydown", wake, opts);
    document.addEventListener("click", eat, opts);
    document.addEventListener("keyup", eat, opts);
    arm();
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", wake, opts);
      document.removeEventListener("keydown", wake, opts);
      document.removeEventListener("click", eat, opts);
      document.removeEventListener("keyup", eat, opts);
    };
  }, [held]);

  return (
    <>
    <main className={`${styles.page} ${dim ? styles.dim : ""}`}>
      {from && onBack ? (
        <TopBar siteName={from.name} onBack={onBack} demo={demo} />
      ) : (
        <div className={styles.top}>{demo && <DemoBadge />}</div>
      )}
      {notice && <div className={styles.notice}>{notice}</div>}
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
            heading={blendHeading(heading, position)}
            weak={position !== null && position.accuracy > MAX_ACCURACY_M}
            locationOff={status === "denied" || status === "unavailable"}
            glow={city.glow?.[shown.id] ?? null}
            connected={city.connected}
            allVisited={next.allVisited}
          />
        )}
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" size="l" block onClick={() => setList(true)}>Sites</Button>
        <Button
          variant="secondary"
          size="l"
          block
          onClick={() => (iphone ? setChoose(true) : shown && open(googleMapsUrl(shown)))}
        >
          Open in Maps
        </Button>
      </div>
    </main>
      {list && (
        <SitesList
          ranked={next.ranked}
          glow={city.glow}
          connected={city.connected}
          allVisited={next.allVisited}
          fromId={from?.id ?? null}
          remote={remote}
          onClose={() => setList(false)}
          onPick={(id) => {
            if (remote) navigate(`/s/${id}${search}`, { state: primer });
            else if (id === from?.id && onBack) onBack();
            else {
              setTargetId(id);
              setList(false);
            }
          }}
        />
      )}
      {choose && (
        <Sheet title="Open in Maps" onClose={() => setChoose(false)}>
          <div className={styles.actions}>
            <Button variant="secondary" size="l" block onClick={() => shown && open(appleMapsUrl(shown))}>Apple Maps</Button>
            <Button variant="secondary" size="l" block onClick={() => shown && open(googleMapsUrl(shown))}>Google Maps</Button>
          </div>
        </Sheet>
      )}
    </>
  );
}
