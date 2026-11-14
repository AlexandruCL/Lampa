# Tiger numbers: raw table against the continuous aggregates

Measured on Tiger service `lampa` (TimescaleDB 2.32.0, Toolkit 1.26.0) on 2026-11-14 at 17:33 +0200 (15:33 UTC), right after migration 005. The statements are the four in `db/explain.sql`, each run once as `EXPLAIN (ANALYZE, BUFFERS)`.

Rows at that moment: `interaction_events` 2,040; `site_activity_1m` 107; `site_activity_1h` 32. The data spans about 20 hours, from 2026-11-13 20:01 UTC.

| Statement | Reads | Rows out | Planning | Execution | Shared buffers hit (top node) |
|---|---|---|---|---|---|
| Glow, aggregate (the shipped `glowSql()`) | `site_activity_1m`, last 24 h | 5 | 0.990 ms | 0.697 ms | 7 |
| Glow, raw (the same formula) | `interaction_events`, last 24 h | 5 | 0.439 ms | 7.001 ms | 146 |
| 30 days per hour, per site | `site_activity_1m` | 17 | 0.698 ms | 0.235 ms | 3 |
| 30 days per hour, per site | `site_activity_1h` | 17 | 0.875 ms | 0.193 ms | 3 |

What this shows:
- **Glow:** the glow loop runs every 5 seconds. Reading the per-minute aggregate takes about 10 times less time than the raw events (0.70 ms against 7.0 ms) and touches about 20 times fewer buffers (7 against 146). With 2,040 events the gap is already clear, and it grows with the event count, because the aggregate holds at most one row per minute, site and kind.
- **30 days:** at this size the hourly and per-minute aggregates are about equally fast, because there is only about one day of data (107 against 32 rows). `site_activity_1h` holds up to 60 times fewer rows than `site_activity_1m` for the same range, so its advantage shows once weeks of data exist.

Policies on Tiger (migration 005; checked in `timescaledb_information.jobs`):
- Columnstore on `interaction_events` and `colour_readings`: segment by `site_id`, order by `ts DESC`, policy after 7 days.
- Retention of 90 days on `interaction_events` and `conversations`. The aggregates keep their rows.
- `site_activity_1h`: hierarchical on `site_activity_1m`, real-time, refreshed every 30 minutes (start 3 hours, end 1 hour).

No chunk is compressed yet, because all data is under 7 days old. No manual `compress_chunk` was run (Fabi's decision, hour 27).
