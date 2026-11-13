// Plans, or with --run makes, the site and project clips into apps/web/public/audio.
// Prints states, file names and credit numbers only, never the key or a response body.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { parseSiteFile, type SiteFile } from "../apps/api/src/db/seed.js";
import {
  MAX_CREDITS_DEFAULT,
  publishProject,
  publishSite,
  toClips,
  type PublishOpts,
  type PublishResult,
} from "../apps/api/src/publish/publish.js";

const USAGE = "usage: npm run publish:site -- (--site <id>... | --site all) [--project] [--run] [--max-credits <n>]";
const ROOT = join(__dirname, "..");
const SITES_DIR = join(ROOT, "content/sites");
const AUDIO_DIR = join(ROOT, "apps/web/public/audio");
const CLIPS_JSON = join(ROOT, "apps/web/src/audio/clips.json");

function args() {
  try {
    const { values } = parseArgs({
      options: {
        site: { type: "string", multiple: true, default: [] },
        project: { type: "boolean", default: false },
        run: { type: "boolean", default: false },
        "max-credits": { type: "string", default: String(MAX_CREDITS_DEFAULT) },
      },
    });
    const maxCredits = Number(values["max-credits"]);
    if ((values.site.length === 0 && !values.project) || !Number.isFinite(maxCredits) || maxCredits < 0) return null;
    return { sites: values.site, project: values.project, run: values.run, maxCredits };
  } catch {
    return null; // unknown option or missing value
  }
}

const exists = (file: string) => existsSync(join(AUDIO_DIR, file));

function readSites(): SiteFile[] {
  return readdirSync(SITES_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((f) => parseSiteFile(readFileSync(join(SITES_DIR, f), "utf8")));
}

// No top-level await: the root package is not "type": "module", so tsx emits CJS.
async function main(): Promise<number> {
  const a = args();
  if (!a) {
    console.log(USAGE);
    return 1;
  }
  const key = process.env.ELEVENLABS_API_KEY ?? "";
  if (a.run && !key) {
    console.log("missing ELEVENLABS_API_KEY");
    return 1;
  }

  const all = readSites();
  for (const id of a.sites)
    if (id !== "all" && !all.some((s) => s.id === id)) {
        console.log(`unknown site ${id}`);
        return 1;
      }
  const chosen = a.sites.includes("all") ? all : all.filter((s) => a.sites.includes(s.id));
  const targets = [
    ...chosen.map((s) => (o: PublishOpts) => publishSite(s, o)),
    ...(a.project ? [(o: PublishOpts) => publishProject(o)] : []),
  ];
  const opts = (run: boolean): PublishOpts => ({
    fetch,
    apiKey: key,
    exists,
    put: (file, bytes) => {
      const path = join(AUDIO_DIR, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, bytes);
    },
    run,
    maxCredits: a.maxCredits,
  });

  // Plan everything first so the cap holds for the whole run, not per site.
  const plans: PublishResult[] = [];
  for (const t of targets) plans.push(await t(opts(false)));
  for (const p of plans)
    for (const i of p.items) console.log(`${i.state === "skipped" ? `skipped:${i.reason}` : i.state} ${i.file} ${i.credits}`);
  const total = plans.reduce((sum, p) => sum + p.newCredits, 0);
  console.log(`total new ${total} credits`);
  if (!a.run) return 0;

  let code = 0;
  if (total > a.maxCredits) {
    console.log(`over cap ${total} > ${a.maxCredits}`);
    code = 1;
  } else {
    for (const t of targets) {
      const r = await t(opts(true));
      for (const i of r.items) {
        if (i.state !== "new") continue;
        if (i.file === r.failed?.file) break;
        console.log(`made ${i.file}`);
      }
      if (r.outcome !== "done") {
        console.log(r.failed ? `failed ${r.failed.file} ${r.failed.status}` : `over cap ${r.newCredits} > ${a.maxCredits}`);
        code = 1;
        break;
      }
    }
  }
  // All five sites and the project, so a run for one site keeps the others.
  writeFileSync(CLIPS_JSON, `${JSON.stringify(toClips(all, exists), null, 2)}\n`);
  return code;
}

main().then((code) => {
  process.exitCode = code;
});
