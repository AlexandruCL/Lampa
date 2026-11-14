import { t } from "../i18n/t";
import styles from "./DemoBadge.module.css";

/** DESIGN.md 6.21. Not interactive; screen readers read it with the top bar. */
export function DemoBadge() {
  return <span className={styles.badge}>{t("demo.badge")}</span>;
}
