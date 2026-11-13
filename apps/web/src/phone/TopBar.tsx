import { Button } from "../components";
import { DemoBadge } from "./DemoBadge";
import styles from "./TopBar.module.css";

/** DESIGN.md 6.20, phone. */
export function TopBar({ siteName, onBack, demo }: { siteName: string; onBack: () => void; demo: boolean }) {
  return (
    <header className={styles.bar}>
      <Button variant="icon" icon="back" aria-label={`Back to ${siteName}`} onClick={onBack} />
      <span className={styles.name}>{siteName}</span>
      <span className={styles.end}>{demo && <DemoBadge />}</span>
    </header>
  );
}
