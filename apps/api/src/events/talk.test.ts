import { describe, expect, it } from "vitest";
import { capTalkTurns, TALK_TURNS_MAX } from "./talk.js";

const t = (siteId: string, kind = "talk_turn") => ({ siteId, kind });

describe("capTalkTurns", () => {
  it("five turns in a batch are kept, the sixth dropped", () => {
    const rows = Array.from({ length: 6 }, () => t("mx"));
    expect(capTalkTurns(rows, new Map())).toHaveLength(5);
    expect(TALK_TURNS_MAX).toBe(5);
  });

  it("turns already stored in the window count", () => {
    expect(capTalkTurns([t("mx"), t("mx"), t("mx")], new Map([["mx", 3]]))).toHaveLength(2);
    expect(capTalkTurns([t("mx")], new Map([["mx", 5]]))).toHaveLength(0);
  });

  it("the cap is per site", () => {
    const out = capTalkTurns([t("mx"), t("rs"), t("rs")], new Map([["mx", 5]]));
    expect(out).toEqual([t("rs"), t("rs")]);
  });

  it("other kinds pass untouched", () => {
    const rows = [t("mx", "wake"), t("mx", "lamp"), t("mx", "echo_heard")];
    expect(capTalkTurns(rows, new Map([["mx", 99]]))).toEqual(rows);
  });

  it("order is kept", () => {
    const rows = [t("mx", "wake"), t("mx"), t("rs"), t("mx", "lamp")];
    expect(capTalkTurns(rows, new Map())).toEqual(rows);
  });
});
