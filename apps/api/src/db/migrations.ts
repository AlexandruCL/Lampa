export const MIGRATIONS_TABLE_SQL =
  "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())";

// Files up to here were applied by db:reset before schema_migrations existed.
export const BASELINE_LAST = "003_colour.sql";

export function pending(files: string[], applied: string[]): string[] {
  const done = new Set(applied);
  return files.filter((f) => !done.has(f)).sort();
}

export function baseline(files: string[]): string[] {
  return files.filter((f) => f <= BASELINE_LAST).sort();
}
