import { bridges, GlowMessage, PaneMessage, SocketMessage } from "@lampa/shared";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { addCityColour, averageGlow, cityFromWindows, emptyCity } from "./panes";
import { fetchStoredWindows } from "./useSiteGlow";

/** The city window and the mean glow of the sites, live. `glow` is `null` until the first message. */
export function useCityWindow(): { filled: (string | null)[]; glow: number | null } {
  const [panes, setPanes] = useState(emptyCity);
  const [glow, setGlow] = useState<number | null>(null);
  useEffect(() => {
    // shortcut: "screen" is the only room that gets every site's panes, and it also sends candles and echoes this page ignores; send panes to "city" if phone traffic matters
    const socket = io(`${API_URL}/live`, { query: { room: "screen" } });
    let live = true;
    socket.on("connect", () => {
      void fetchStoredWindows().then((windows) => live && windows && setPanes(cityFromWindows(windows)));
    });
    socket.on(SocketMessage.enum.glow, (m: unknown) => {
      const g = GlowMessage.safeParse(m);
      if (g.success) setGlow(averageGlow(g.data.sites.filter((s) => !bridges.some((b) => b.id === s.siteId)).map((s) => s.glow)));
    });
    socket.on(SocketMessage.enum.pane, (m: unknown) => {
      const p = PaneMessage.safeParse(m);
      // The Gallery holds remote colours and is not a site.
      if (p.success && p.data.siteId !== "gallery") setPanes((s) => addCityColour(s, p.data.hex));
    });
    return () => {
      live = false;
      socket.close();
    };
  }, []);
  return { filled: panes.filled, glow };
}
