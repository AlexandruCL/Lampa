import { LANG, t } from "../i18n/t";
import { photosFor } from "./photos";
import styles from "./PhotoStrip.module.css";

/** A swipeable strip of the site's historical photos; renders nothing when the site has none. */
export function PhotoStrip({ siteId }: { siteId: string }) {
  const photos = photosFor(siteId);
  if (photos.length === 0) return null;
  return (
    // tabIndex: a scrollable region must be reachable by keyboard
    <ul className={styles.strip} aria-label={t("photos.label")} tabIndex={0}>
      {photos.map((p) => (
        <li key={p.file} className={styles.item}>
          <figure className={styles.figure}>
            <img className={styles.img} src={`/photos/${siteId}/${p.file}`} alt={p.caption[LANG]} loading="lazy" />
            <figcaption className={styles.caption}>
              {p.year} · {p.caption[LANG]}
              <span className={styles.credit}>{p.credit}</span>
            </figcaption>
          </figure>
        </li>
      ))}
    </ul>
  );
}
