import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { unlockAudio } from "../audio/context";
import { Button, Icon, Notice } from "../components";
import { siteName, t } from "../i18n/t";
import { markVisited } from "../nav/visited";
import { isDemo } from "../sensors/demo";
import { primeDevice, type PrimerResult } from "../sensors/primer";
import { fetchSite } from "../api/sites";
import { findSite, type PhoneSite } from "../sites/sites";
import { DemoBadge } from "./DemoBadge";
import styles from "./Join.module.css";
import { Memorial } from "./Memorial";
import { RoseWindow } from "./RoseWindow";
import { Between } from "./Between";
import { SiteView } from "./SiteView";

// A reload clears this, so history state from before it is ignored: the AudioContext needs a new tap.
let primedThisLoad = false;
// This load's primer result: a back to "/" or a site page after the tap has no history state to read it from.
let lastPrimer: PrimerResult | null = null;

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
  const [result, setResult] = useState<PrimerResult | null>(primedThisLoad ? ((state as PrimerResult | null) ?? lastPrimer) : null);
  const [busy, setBusy] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(result?.audio === "blocked");

  const bundled = siteId === undefined ? undefined : findSite(siteId);
  // undefined: looking; null: 404; "error": any other failure. A bundled site never fetches.
  const [fetched, setFetched] = useState<PhoneSite | null | "error" | undefined>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (siteId === undefined || bundled) return;
    let live = true;
    setFetched(undefined);
    fetchSite(siteId).then(
      (s) => live && setFetched(s),
      () => live && setFetched("error"),
    );
    return () => {
      live = false;
    };
  }, [siteId, bundled, attempt]);
  const site = bundled ?? (typeof fetched === "object" ? (fetched ?? undefined) : undefined);
  const city = siteId === undefined;
  const name = city ? "Timișoara" : site && siteName(site);

  useEffect(() => {
    if (result && site?.is_memorial) markVisited(site.id);
  }, [result, site]);

  const top = <div className={styles.top}>{demo && <DemoBadge />}</div>;

  if (!city && !site && fetched !== null) {
    const failed = fetched === "error";
    return (
      <main className={styles.page}>
        {top}
        {failed ? (
          <>
            <Notice variant="error">{t("join.unreachable")}</Notice>
            <div className={styles.actions}>
              <Button variant="secondary" size="l" block onClick={() => setAttempt((n) => n + 1)}>
                {t("join.try_again")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.wordmark}>LAMPA</p>
            <p className={styles.line} role="status">{t("join.looking")}</p>
          </>
        )}
      </main>
    );
  }

  if (!city && !site) {
    return (
      <main className={styles.page}>
        {top}
        <h1 className={styles.name}>{t("join.not_found")}</h1>
        <div className={styles.actions}>
          <Button variant="primary" size="l" block onClick={() => navigate("/")}>
            {t("join.show_all")}
          </Button>
        </div>
      </main>
    );
  }

  const tap = async () => {
    setBusy(true);
    primedThisLoad = true;
    const r = await primeDevice({ demo });
    lastPrimer = r;
    setBusy(false);
    setResult(r);
    setAudioBlocked(r.audio === "blocked");
  };

  const memorial = !!site?.is_memorial;

  if (result) {
    const notice = audioBlocked ? (
      <Notice variant="info" icon="headphones">
        <Button variant="quiet" onClick={async () => setAudioBlocked((await unlockAudio()) === "blocked")}>
          {t("join.tap_listen")}
        </Button>
      </Notice>
    ) : (
      result.location === "denied" && (
        <Notice variant="info">{t("join.location_off")}</Notice>
      )
    );
    const remote = new URLSearchParams(search).get("mode") === "remote";
    if (city) {
      const noLocation = remote || result.location === "denied";
      const denied = result.location === "denied" && (
        <Notice variant="info">{t("join.location_off")}</Notice>
      );
      return <Between from={null} primer={result} demo={demo} remote={noLocation} notice={denied || undefined} />;
    }
    return memorial ? (
      <Memorial site={site!} demo={demo} remote={remote} primer={result} notice={notice || undefined} />
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
          <p className={styles.line}>{t("memorial.lead")}</p>
          <div className={styles.visual}>
            <Candle />
          </div>
        </>
      ) : (
        <>
          <p className={styles.line}>{t("join.asleep", { name: name! })}</p>
          <div className={styles.visual}>
            <RoseWindow name={name!} size="l" filled={EMPTY_PANES} />
          </div>
        </>
      )}
      <div className={styles.actions}>
        <p className={styles.hint}>
          <Icon name="headphones" />
          {t("join.headphones")}
        </p>
        <Button variant="primary" size="l" block loading={busy} onClick={tap}>
          {memorial
            ? t("join.listen")
            : city
              ? t(busy ? "join.waking_city" : "join.wake_city")
              : t(busy ? "join.waking" : "join.wake", { name: name! })}
        </Button>
        <p className={styles.keep}>
          {t("join.keep_open")}
        </p>
      </div>
    </main>
  );
}
