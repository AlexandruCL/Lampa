import { metaLine } from "../nav/format";
import type { Ranked } from "../nav/score";
import styles from "./SiteRow.module.css";
import { GlowMark } from "./GlowMark";

type Props = {
  entry: Ranked;
  glow: number | null;
  connected: boolean;
  here: boolean;
  remote: boolean;
  allVisited?: boolean; // the list's flag: the tag then reads "Going dark"
  onPick: () => void;
};

/** DESIGN.md 6.9. */
export function SiteRow({ entry, glow, connected, here, remote, allVisited = false, onPick }: Props) {
  const { site, distanceM, tag } = entry;
  const meta = remote ? null : here ? "You are here" : distanceM === null ? "Distance unknown" : metaLine(distanceM);
  const tagText =
    remote || !tag ? null : allVisited && tag === "going dark" ? "Going dark" : `Suggested: ${tag}`;
  return (
    <button type="button" className={styles.row} onClick={onPick}>
      {site.is_memorial ? (
        <span className={styles.memorial}>Memorial</span>
      ) : (
        <GlowMark siteName={site.name} glow={glow} connected={connected} size="s" />
      )}
      <span className={styles.text}>
        <span className={styles.name}>{site.name}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
      </span>
      {tagText && <span className={styles.tag}>{tagText}</span>}
    </button>
  );
}
