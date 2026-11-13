// Checks the ElevenLabs agent: client overrides enabled and a signed URL issued.
// Prints statuses and booleans only, never the key, the agent id, the URL or a body.
import process from "node:process";

const API = "https://api.elevenlabs.io/v1/convai";
const TIMEOUT_MS = 10000;

const key = process.env.ELEVENLABS_API_KEY ?? "";
const agentId = process.env.ELEVENLABS_AGENT_ID ?? "";
if (!key) console.log("missing ELEVENLABS_API_KEY");
if (!agentId) console.log("missing ELEVENLABS_AGENT_ID");
if (!key || !agentId) process.exit(1);

// Returns the status and parsed body, or null on timeout or network error.
async function get(path: string): Promise<{ status: number; body: any } | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: res.status, body: res.status === 200 ? await res.json() : null };
  } catch {
    return null;
  }
}

// No top-level await: the root package is not "type": "module", so tsx emits CJS.
async function main(): Promise<boolean> {
  let ok = true;

  const agent = await get(`/agents/${encodeURIComponent(agentId)}`);
  console.log(`agent ${agent?.status ?? "error"}`);
  ok &&= agent?.status === 200;
  if (agent?.status === 200) {
    const o = agent.body?.platform_settings?.overrides?.conversation_config_override;
    const flags: [string, unknown][] = [
      ["prompt", o?.agent?.prompt?.prompt],
      ["first_message", o?.agent?.first_message],
      ["language", o?.agent?.language],
      ["voice_id", o?.tts?.voice_id],
    ];
    for (const [name, v] of flags) {
      console.log(`override ${name} ${v === true}`);
      ok &&= v === true;
    }
  }

  const signed = await get(`/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`);
  const hasUrl =
    signed?.status === 200 && typeof signed.body?.signed_url === "string" && signed.body.signed_url !== "";
  console.log(`signed_url ${signed?.status ?? "error"} ${hasUrl}`);
  ok &&= hasUrl;
  return ok;
}

main().then((ok) => process.exit(ok ? 0 : 1));
