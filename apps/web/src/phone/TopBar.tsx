import { Button } from "../components";
import { DemoBadge } from "./DemoBadge";
import styles from "./TopBar.module.css";

/** DESIGN.md 6.20, phone. No back button without `onBack`; `backLabel` replaces the "Back to {siteName}" name. */
export function TopBar({ siteName, onBack, backLabel, demo }: { siteName: string; onBack?: () => void; backLabel?: string; demo: boolean }) {
  return (
    <header className={styles.bar}>
      {onBack ? <Button variant="icon" icon="back" aria-label={backLabel ?? `Back to ${siteName}`} onClick={onBack} /> : <span />}
      <span className={styles.name}>{siteName}</span>
      <span className={styles.end}>{demo && <DemoBadge />}</span>
    </header>
  );
}
