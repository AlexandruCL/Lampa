import { describe, expect, it } from "vitest";
import { TODAY_START_SQL } from "../db/today.js";
import { LAMPS_SQL, LAMP_PRESENCE_S, toLampsMessage } from "./lamps.js";

describe("toLampsMessage", () => {
  it("toLampsMessage carries lit_today and target 731", () => {
    const m = toLampsMessage([{ site_id: "mx", lit_today: 12, lighting_now: 0 }]);
    expect(m.litToday).toBe(12);
    expect(m.target).toBe(731);
  });

  it("a site row becomes siteId and lightingNow", () => {
    const m = toLampsMessage([
      { site_id: "bastion", lit_today: 4, lighting_now: 2 },
      { site_id: "mx", lit_today: 4, lighting_now: 0 },
    ]);
    expect(m.sites).toEqual([
      { siteId: "bastion", lightingNow: 2 },
      { siteId: "mx", lightingNow: 0 },
    ]);
  });

  it("an invalid row throws", () => {
    expect(() => toLampsMessage([{ site_id: "mx", lit_today: "4", lighting_now: 0 }])).toThrow();
    expect(() => toLampsMessage([{ site_id: "mx", lit_today: 4, lighting_now: -1 }])).toThrow();
    expect(() => toLampsMessage([])).toThrow();
  });
});

describe("LAMPS_SQL", () => {
  it("LAMPS_SQL counts distinct sessions", () => {
    expect(LAMPS_SQL).toContain("count(DISTINCT e.session_id)::int FROM interaction_events e");
    expect(LAMPS_SQL).toContain("WHERE e.site_id = s.id AND e.kind = 'lamp'");
  });

  it("LAMPS_SQL uses the 90 s window", () => {
    expect(LAMP_PRESENCE_S).toBe(90);
    expect(LAMPS_SQL).toContain("e.ts > now() - make_interval(secs => 90)) AS lighting_now");
  });

  it("LAMPS_SQL leaves memorial sites out", () => {
    expect(LAMPS_SQL).toContain("WHERE s.status = 'published' AND NOT s.is_memorial AND 'lamp' = ANY(s.interactions)");
    // lit_today stays city-wide, the rule of STATS_SQL.
    expect(LAMPS_SQL).toContain(`(SELECT count(*)::int FROM interaction_events\n    WHERE kind = 'lamp' AND ts >= ${TODAY_START_SQL}) AS lit_today`);
  });
});
