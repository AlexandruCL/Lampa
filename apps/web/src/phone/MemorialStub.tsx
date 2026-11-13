import type { ReactNode } from "react";
import { useBed } from "../audio/useBed";
import { Button } from "../components";
import { DemoBadge } from "./DemoBadge";
import styles from "./SiteView.module.css";

/** Memorial view stub (B1-3.b): no glow, no number, no window, no socket. Entry points have no action yet. */
export function MemorialStub({ siteId, name, demo, notice }: { siteId: string; name: string; demo: boolean; notice?: ReactNode }) {
  useBed(siteId, null);
  return (
    <main className={styles.page}>
      <div className={styles.top}>{demo && <DemoBadge />}</div>
      {notice}
      <h1 className={styles.name}>{name}</h1>
      <p className={styles.memorial}>Memorial</p>
      <div className={styles.actions}>
        <Button variant="secondary" size="l" block>Listen</Button>
        <Button variant="secondary" size="l" block>Light a candle</Button>
      </div>
    </main>
  );
}
