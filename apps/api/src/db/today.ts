/** SQL for local midnight today in Timișoara, as a timestamptz. */
export const TODAY_START_SQL = "(date_trunc('day', now() AT TIME ZONE 'Europe/Bucharest') AT TIME ZONE 'Europe/Bucharest')";
