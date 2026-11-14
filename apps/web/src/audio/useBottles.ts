import { Bottles } from "@lampa/shared";
import { useEffect, useState } from "react";
import { API_URL } from "../api/client";
import { loadBuffer } from "./engine";
import { pannerPosition } from "./navMaths";
import { playWhisper, type Whisper } from "./whisper";

// 10 s, not the plan's 30 s: at the table-demo speed (a minute between bridges) a bottle is in range for about 22 s.
export const BOTTLE_POLL_MS = 10_000;

// Per page load, so that leaving the site view and coming back does not replay a bottle.
const heard = new Set<string>();

/** The bottles not yet waiting or heard, in the order given. */
export function newBottles<W extends Whisper>(bottles: readonly W[], known: ReadonlySet<string>): W[] {
  return bottles.filter((b, i) => !known.has(b.echoId) && bottles.findIndex((x) => x.echoId === b.echoId) === i);
}

/**
 * Message in a Bottle: asks which bottles are drifting past the bridge, on arrival and every BOTTLE_POLL_MS,
 * and plays each one once, centred. `bridgeId` null plays nothing. True while a bottle is loading or playing.
 */
export function useBottles(bridgeId: string | null): boolean {
  const [passing, setPassing] = useState(false);

  useEffect(() => {
    if (!bridgeId) return;
    let gone = false;
    let now: Whisper | null = null; // loading or playing
    let playing: ReturnType<typeof playWhisper> | null = null;
    const waiting: Whisper[] = [];

    function next() {
      if (gone) return;
      now = waiting.shift() ?? null;
      setPassing(now !== null);
      if (!now) return;
      const { echoId, audioUrl } = now;
      const done = () => {
        heard.add(echoId); // a bottle cut off by leaving the view is not marked, so it plays again on return
        playing = null;
        next();
      };
      loadBuffer(API_URL + audioUrl).then((buffer) => {
        if (!gone) playing = playWhisper(buffer, pannerPosition(null, null), done);
      }, done); // a failed load or decode skips this bottle
    }

    const poll = () =>
      fetch(`${API_URL}/echoes/bottles?site=${bridgeId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((body: unknown) => {
          const parsed = Bottles.safeParse(body);
          if (gone || !parsed.success) return;
          const known = new Set([...heard, ...waiting.map((w) => w.echoId), ...(now ? [now.echoId] : [])]);
          waiting.push(...newBottles(parsed.data.echoes, known));
          if (!now) next();
        })
        .catch(() => {}); // offline or 503: the next poll tries again
    void poll();
    const timer = setInterval(poll, BOTTLE_POLL_MS);

    return () => {
      gone = true;
      clearInterval(timer);
      playing?.stop();
      setPassing(false);
    };
  }, [bridgeId]);

  return passing;
}
