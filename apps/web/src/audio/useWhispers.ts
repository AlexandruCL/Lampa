import { ApprovedEchoes, EchoApprovedMessage, SocketMessage } from "@lampa/shared";
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/client";
import { bearingDeg, type LatLng } from "../geo/geo";
import { findSite } from "../sites/sites";
import { getAudioContext } from "./context";
import { loadBuffer } from "./engine";
import { pannerPosition, SMOOTH_S } from "./navMaths";
import { addWhisper, nextWhisper, playWhisper, WHISPER_GAP_MS, type Whisper } from "./whisper";

/**
 * Approved echoes of the site, one at a time, WHISPER_GAP_MS apart, from the site's direction
 * (centred without position or heading). `siteId` null plays nothing; never at the memorial.
 */
export function useWhispers(siteId: string | null, position: LatLng | null, heading: number | null): void {
  const site = siteId ? findSite(siteId) : undefined;
  const at = pannerPosition(site && position ? bearingDeg(position, site) : null, heading);
  const atRef = useRef(at);
  atRef.current = at;
  const panner = useRef<PannerNode | null>(null);

  useEffect(() => {
    const p = panner.current;
    if (!p) return;
    const t = getAudioContext().currentTime;
    p.positionX.setTargetAtTime(at.x, t, SMOOTH_S);
    p.positionZ.setTargetAtTime(at.z, t, SMOOTH_S);
  }, [at.x, at.z]);

  const id = site && !site.is_memorial ? site.id : null;
  useEffect(() => {
    if (!id) return;
    let gone = false;
    let busy = false; // loading, playing or waiting out the gap
    let list: Whisper[] = [];
    let last: string | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let playing: ReturnType<typeof playWhisper> | null = null;

    const later = () => {
      if (!gone) timer = setTimeout(next, WHISPER_GAP_MS);
    };
    function next() {
      const w = nextWhisper(list, last);
      busy = w !== null;
      if (!w) return; // idle until an echo arrives
      last = w.echoId;
      loadBuffer(API_URL + w.audioUrl).then(
        (buffer) => {
          if (gone) return;
          playing = playWhisper(buffer, atRef.current, () => {
            playing = panner.current = null;
            later();
          });
          panner.current = playing.panner;
        },
        later, // a failed load or decode skips this echo; the next one comes after the gap
      );
    }
    const add = (w: Whisper) => {
      list = addWhisper(list, w);
      if (!busy) next();
    };

    fetch(`${API_URL}/echoes/approved?site=${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: unknown) => {
        const parsed = ApprovedEchoes.safeParse(body);
        if (gone || !parsed.success) return;
        // newest first from the route: add oldest first so the list keeps that order
        for (const e of [...parsed.data.echoes].reverse()) list = addWhisper(list, e);
        if (!busy) next();
      })
      .catch(() => {}); // 503 without a database or offline: live echoes still come in

    // A second socket beside useSiteGlow's: that hook is Ionut's and exposes no echo messages.
    const socket = io(`${API_URL}/live`, { query: { room: `site:${id}` } });
    socket.on(SocketMessage.enum.echo_approved, (m: unknown) => {
      const e = EchoApprovedMessage.safeParse(m);
      if (e.success && e.data.siteId === id) add(e.data);
    });

    return () => {
      gone = true;
      clearTimeout(timer);
      socket.close();
      playing?.stop();
      panner.current = null;
    };
  }, [id]);
}
