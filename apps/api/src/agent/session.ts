import { AgentLang, AgentSession } from "@lampa/shared";
import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { requireVisitor } from "../auth/session.js";

export type Persona = { prompt: string; firstMessage: string; voiceId: string };
export type SiteStats = { glow: number; coloursToday: number; lampsToday: number };
export type AgentDeps = {
  getPersona?: (siteId: string, lang: AgentLang) => Promise<Persona | null>;
  getSiteStats?: (siteId: string) => Promise<SiteStats>;
  fetch?: typeof fetch; // the ElevenLabs call; tests pass a fake
};

// shortcut: site ids are fixed here until packages/shared/sites.json lands; read them from it then
const PERSONA_SITE_IDS = ["mx", "unirii", "victoriei", "bastion"];
// shortcut: site ids are fixed here until packages/shared/sites.json lands; read them from it then
const MEMORIAL_SITE_IDS = ["cathedral"];
const ELEVENLABS_TIMEOUT_MS = 5000;
const SIGNED_URL_ENDPOINT = "https://api.elevenlabs.io/v1/convai/conversation/get-signed-url";

const bucharestTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Bucharest",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

// Answers null on any failure; the upstream body and the key are never logged or returned.
async function signedUrl(doFetch: typeof fetch): Promise<string | null> {
  // Env is read per request so tests can set it after import.
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!key || !agentId) return null;
  try {
    const res = await doFetch(`${SIGNED_URL_ENDPOINT}?agent_id=${agentId}`, {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(ELEVENLABS_TIMEOUT_MS),
    });
    if (res.status !== 200) return null;
    const body: unknown = await res.json();
    const url = (body as { signed_url?: unknown } | null)?.signed_url;
    return typeof url === "string" && url ? url : null;
  } catch {
    return null;
  }
}

export function createAgentRouter(deps: AgentDeps = {}): Router {
  const router = Router();
  // shortcut: memory store, counts reset on restart and are per instance; move to a shared store if the API runs on more than one instance
  const sessionLimiter = rateLimit({
    windowMs: 600_000,
    limit: 6,
    keyGenerator: (req) => req.visitor!.sub,
  });

  router.get("/agent/session", requireVisitor, sessionLimiter, async (req, res) => {
    const site = typeof req.query.site === "string" ? req.query.site : "";
    if (MEMORIAL_SITE_IDS.includes(site)) {
      res.status(404).json({ error: "no_persona" });
      return;
    }
    if (!PERSONA_SITE_IDS.includes(site)) {
      res.status(404).json({ error: "unknown_site" });
      return;
    }
    const parsedLang = AgentLang.safeParse(req.query.lang);
    const lang: AgentLang = parsedLang.success ? parsedLang.data : "en";

    const url = await signedUrl(deps.fetch ?? fetch);
    if (!url) {
      res.status(503).json({ error: "agent_unavailable" });
      return;
    }

    const persona = deps.getPersona ? await deps.getPersona(site, lang) : null;
    const stats = (await deps.getSiteStats?.(site).catch(() => undefined)) ?? { glow: 0, coloursToday: 0, lampsToday: 0 };

    const session = AgentSession.parse({
      signedUrl: url,
      ...(persona && {
        overrides: {
          agent: { prompt: { prompt: persona.prompt }, firstMessage: persona.firstMessage, language: lang },
          tts: { voiceId: persona.voiceId },
        },
      }),
      dynamicVariables: {
        visitor_name: "traveller",
        local_time: bucharestTime.format(new Date()),
        site_glow: Math.round(stats.glow * 100),
        colours_today: stats.coloursToday,
        lamps_lit_today: stats.lampsToday,
        sites_visited: "none yet",
        returning_visitor: "no",
      },
    });
    res.set("Cache-Control", "no-store").json(session);
  });

  return router;
}
