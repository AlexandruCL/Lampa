import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { setBedMuted } from "../audio/engine";
import { useBed } from "../audio/useBed";
import { Button } from "../components";
import { LANG, siteName, t } from "../i18n/t";
import { testimoniesFor } from "../memorial/testimonies";
import { requestCompass, type PrimerResult } from "../sensors/primer";
import type { PhoneSite } from "../sites/sites";
import { Between } from "./Between";
import { Candle } from "./Candle";
import styles from "./Memorial.module.css";
import { Testimony } from "./Testimony";
import { TopBar } from "./TopBar";

/** Memorial view (DESIGN.md 7.11): lead, testimonies when there are any, the candle. No glow, number or window. */
export function Memorial({ site, demo, remote, primer, notice }: { site: PhoneSite; demo: boolean; remote: boolean; primer: PrimerResult; notice?: ReactNode }) {
  const navigate = useNavigate();
  const { key, search } = useLocation();
  const [view, setView] = useState<"memorial" | "between">("memorial");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const name = siteName(site);
  const items = testimoniesFor(site.id, LANG);
  useBed(site.id, null);

  useEffect(() => {
    setBedMuted(playingId !== null);
  }, [playingId]);
  useEffect(() => () => setBedMuted(false), []);

  const stop = useCallback((id: string) => setPlayingId((p) => (p === id ? null : p)), []);

  if (view === "between") {
    return <Between from={site} primer={primer} demo={demo} remote={remote} onBack={() => setView("memorial")} />;
  }

  const cameInside = key !== "default";
  return (
    <main className={styles.page}>
      <TopBar siteName={name} demo={demo} onBack={cameInside ? () => navigate(-1) : undefined} backLabel={t("back")} />
      {notice}
      <h1 className={styles.name}>{name}</h1>
      <p className={styles.lead}>{t("memorial.lead")}</p>
      {items.length > 0 && (
        <>
          <h2 className={styles.heading}>{t("memorial.testimonies")}</h2>
          <p className={styles.narrator}>{t("memorial.narrator")}</p>
          <ul className={styles.list}>
            {items.map((item) => (
              <Testimony key={item.id} item={item} active={playingId === item.id} onStart={() => setPlayingId(item.id)} onStop={() => stop(item.id)} />
            ))}
          </ul>
        </>
      )}
      <div className={styles.candle}>
        <Candle siteId={site.id} demo={demo} />
      </div>
      <div className={styles.next}>
        <Button
          variant="quiet"
          size="l"
          block
          onClick={() => {
            // The demo primer asks for no motion permission; on an iPhone the prompt must come from this tap.
            if (demo && !new URLSearchParams(search).has("heading")) void requestCompass();
            setPlayingId(null);
            setView("between");
          }}
        >
          {t("next_site")}
        </Button>
      </div>
    </main>
  );
}
