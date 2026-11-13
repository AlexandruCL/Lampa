import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { unlockAudio } from "../audio/context";
import { Button, Icon, Notice } from "../components";
import { markVisited } from "../nav/visited";
import { isDemo } from "../sensors/demo";
import { primeDevice, type PrimerResult } from "../sensors/primer";
import { findSite } from "../sites/sites";
import { DemoBadge } from "./DemoBadge";
import styles from "./Join.module.css";
import { MemorialStub } from "./MemorialStub";
import { RoseWindow } from "./RoseWindow";
import { Between } from "./Between";
import { SiteView } from "./SiteView";

// A reload clears this, so history state from before it is ignored: the AudioContext needs a new tap.
let primedThisLoad = false;

const EMPTY_PANES: null[] = Array(48).fill(null);

function Candle() {
  return (
    <svg className={styles.candle} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <rect className={styles.stem} x="94" y="112" width="12" height="48" rx="2" />
      {/* teardrop 18 x 30, unlit: scaled 0.4 from its base */}
      <path
        className={styles.flame}
        transform="translate(100 112) scale(0.4) translate(-100 -112)"
        d="M100 82C106 94 109 98 109 103A9 9 0 0 1 91 103C91 98 94 94 100 82Z"
      />
    </svg>
  );
}

/** Join and permission primer (DESIGN.md 7.1). */
export default function Join({ siteId }: { siteId?: string }) {
  const { search, state } = useLocation();
  const navigate = useNavigate();
  const demo = isDemo(search);
  const [result, setResult] = useState<PrimerResult | null>(primedThisLoad ? (state as PrimerResult | null) : null);
  const [busy, setBusy] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(result?.audio === "blocked");

  const site = siteId === undefined ? undefined : findSite(siteId);
  const city = siteId === undefined;
  const name = city ? "Timișoara" : site?.name;

  useEffect(() => {
    if (result && site?.is_memorial) markVisited(site.id);
  }, [result, site]);

  const top = <div className={styles.top}>{demo && <DemoBadge />}</div>;

  if (!city && !site) {
    return (
      <main className={styles.page}>
        {top}
        <h1 className={styles.name}>We could not find this place.</h1>
        <div className={styles.actions}>
          <Button variant="primary" size="l" block onClick={() => navigate("/")}>
            Show all sites
          </Button>
        </div>
      </main>
    );
  }

  const tap = async () => {
    setBusy(true);
    primedThisLoad = true;
    const r = await primeDevice({ demo });
    setBusy(false);
    setResult(r);
    setAudioBlocked(r.audio === "blocked");
  };

  const memorial = !!site?.is_memorial;

  if (result) {
    const notice = audioBlocked ? (
      <Notice variant="info" icon="headphones">
        <Button variant="quiet" onClick={async () => setAudioBlocked((await unlockAudio()) === "blocked")}>
          Tap to listen
        </Button>
      </Notice>
    ) : (
      result.location === "denied" && (
        <Notice variant="info">Location is off. This site still works. To walk to the next one, use the list.</Notice>
      )
    );
    const remote = new URLSearchParams(search).get("mode") === "remote";
    if (city) {
      const noLocation = remote || result.location === "denied";
      const denied = result.location === "denied" && (
        <Notice variant="info">Location is off. This site still works. To walk to the next one, use the list.</Notice>
      );
      return <Between from={null} primer={result} demo={demo} remote={noLocation} notice={denied || undefined} />;
    }
    return memorial ? (
      <MemorialStub siteId={site!.id} name={name!} demo={demo} notice={notice || undefined} />
    ) : (
      <SiteView
        key={site!.id}
        site={site!}
        demo={demo}
        remote={remote}
        notice={notice || undefined}
        compass={result.compass}
        primer={result}
        arrived={primedThisLoad && (state as { arrived?: boolean } | null)?.arrived === true}
      />
    );
  }

  return (
    <main className={styles.page}>
      {top}
      <p className={styles.wordmark}>LAMPA</p>
      <h1 className={styles.name}>{name}</h1>
      {memorial ? (
        <>
          <p className={styles.line}>A place of remembrance for December 1989.</p>
          <div className={styles.visual}>
            <Candle />
          </div>
        </>
      ) : (
        <>
          <p className={styles.line}>{name} is asleep.</p>
          <div className={styles.visual}>
            <RoseWindow name={name!} size="l" filled={EMPTY_PANES} />
          </div>
        </>
      )}
      <div className={styles.actions}>
        <p className={styles.hint}>
          <Icon name="headphones" />
          Put on headphones. LAMPA guides you with sound.
        </p>
        <Button variant="primary" size="l" block loading={busy} onClick={tap}>
          {memorial ? "Listen" : city ? (busy ? "Waking the city" : "Wake the city") : busy ? `Waking ${name}` : `Wake ${name}`}
        </Button>
        <p className={styles.keep}>
          Keep LAMPA open while you walk. Sound and location stop when the page is in the background.
        </p>
      </div>
    </main>
  );
}
