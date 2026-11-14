import { pathToFileURL } from "node:url";
import { PLACE_ID, sites } from "@lampa/shared";
import type { Db } from "../seam.js";
import { asDb, createPool } from "../db/pool.js";

// Back to draft only: windows, panes, echoes and events keep pointing at the site.
export const RESET_PLACE = "UPDATE sites SET status = 'draft' WHERE id = $1 AND status = 'published'";

export async function resetPlace(db: Db, id: string): Promise<"reset" | "seeded" | "invalid" | "none"> {
  if (!PLACE_ID.test(id)) return "invalid";
  if (sites.some((s) => s.id === id)) return "seeded";
  const { rowCount } = await db.query(RESET_PLACE, [id]);
  return rowCount ? "reset" : "none";
}

async function main(): Promise<number> {
  const id = process.argv[2] ?? "";
  const pool = createPool();
  try {
    const outcome = await resetPlace(asDb(pool), id);
    const lines = {
      reset: `reset ${id}`,
      seeded: `refused: ${id} is a seeded site`,
      invalid: "refused: invalid id",
      none: `no published place ${id}`,
    };
    console.log(lines[outcome]);
    return outcome === "reset" ? 0 : 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exit(1);
    },
  );
}
