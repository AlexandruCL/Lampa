import type { Ranked } from "../nav/score";
import { Sheet } from "./Sheet";
import { SiteRow } from "./SiteRow";

type Props = {
  ranked: Ranked[];
  glow: Readonly<Record<string, number>> | null;
  connected: boolean;
  allVisited: boolean;
  fromId: string | null;
  remote: boolean;
  onPick: (id: string) => void;
  onClose: () => void;
};

/** DESIGN.md 7.9, in a Sheet. The loading and error states are not built: the five sites ship with the app. */
export function SitesList({ ranked, glow, connected, allVisited, fromId, remote, onPick, onClose }: Props) {
  const rows = remote ? [...ranked].sort((a, b) => a.site.name.localeCompare(b.site.name)) : ranked;
  return (
    <Sheet title="Sites" onClose={onClose}>
      {rows.map((entry) => (
        <SiteRow
          key={entry.site.id}
          entry={entry}
          glow={entry.site.is_memorial ? null : (glow?.[entry.site.id] ?? null)}
          connected={connected}
          here={entry.site.id === fromId}
          remote={remote}
          allVisited={allVisited}
          onPick={() => onPick(entry.site.id)}
        />
      ))}
    </Sheet>
  );
}
