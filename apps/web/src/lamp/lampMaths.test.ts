import { describe, expect, it } from "vitest";
import { RAISE_START, type RaiseState, lampEventDue, pitchFromBeta, stepRaise } from "./lampMaths";

// Literal angles and times on purpose: a change to the constants or comparisons must fail here.
const run = (samples: [pitch: number | null, nowMs: number][], start: RaiseState = RAISE_START) => {
  let state = start;
  let progress = 0;
  for (const [pitch, now] of samples) ({ state, progress } = stepRaise(state, pitch, now));
  return { state, progress };
};

const T = 10_000;
const lit = (): RaiseState => run([[70, T], [70, T + 1500]]).state;

describe("pitchFromBeta", () => {
  it.each([
    [-120, 60],
    [-30, 30],
    [0, 0],
    [45, 45],
    [90, 90],
    [135, 45],
    [null, null],
  ])("%s gives %s", (beta, pitch) => {
    expect(pitchFromBeta(beta)).toBe(pitch);
  });
});

describe("stepRaise", () => {
  it("lights at exactly 1500 ms at or above 60, not at 1499", () => {
    expect(run([[60, T], [60, T + 1499]]).state.phase).toBe("down");
    expect(run([[60, T], [60, T + 1500]]).state.phase).toBe("lit");
  });

  it("restarts the hold after a dip to 59", () => {
    const after = run([[70, T], [59, T + 1000], [70, T + 1100], [70, T + 2000]]);
    expect(after.state.phase).toBe("down");
    expect(run([[70, T + 1100], [70, T + 2600]], after.state).state.phase).toBe("lit");
  });

  it("does not treat 40 as below", () => {
    expect(run([[40, T + 2000], [40, T + 3000]], lit()).state.phase).toBe("lit");
  });

  it("lowers after 500 ms under 40, not at 499", () => {
    expect(run([[39, T + 2000], [39, T + 2499]], lit()).state.phase).toBe("lit");
    expect(run([[39, T + 2000], [39, T + 2500]], lit()).state.phase).toBe("down");
  });

  it("reports progress 0, 0.5 and 1", () => {
    expect(run([[70, T]]).progress).toBe(0);
    expect(run([[70, T], [70, T + 750]]).progress).toBe(0.5);
    expect(run([[70, T], [70, T + 1500]]).progress).toBe(1);
    expect(run([[70, T], [70, T + 750], [30, T + 800]]).progress).toBe(0);
  });

  it("treats a null pitch as no reading", () => {
    expect(run([[70, T], [null, T + 1000], [70, T + 1500]]).state.phase).toBe("down");
    expect(run([[null, T + 2000], [null, T + 3000]], lit()).state.phase).toBe("lit");
  });
});

describe("lampEventDue", () => {
  it("is due at once, then again at each whole minute", () => {
    expect(lampEventDue(T, 0, T)).toBe(true);
    expect(lampEventDue(T, 1, T + 59_999)).toBe(false);
    expect(lampEventDue(T, 1, T + 60_000)).toBe(true);
  });
});
