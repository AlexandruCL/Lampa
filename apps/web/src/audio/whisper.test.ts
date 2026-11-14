import { describe, expect, it } from "vitest";
import { addWhisper, nextWhisper, WHISPER_COUNT, type Whisper } from "./whisper";

const w = (id: string): Whisper => ({ echoId: id, audioUrl: `/blob/${id}` });
const five = ["e5", "e4", "e3", "e2", "e1"].map(w); // newest first, as the route sends them

describe("nextWhisper", () => {
  it("an empty list gives nothing", () => expect(nextWhisper([], null)).toBeNull());

  it("one echo plays again and again", () => {
    expect(nextWhisper([w("a")], null)?.echoId).toBe("a");
    expect(nextWhisper([w("a")], "a")?.echoId).toBe("a");
  });

  it("five echoes go round in order and wrap", () => {
    let last: string | null = null;
    const played: string[] = [];
    for (let i = 0; i < 7; i++) played.push((last = nextWhisper(five, last)!.echoId));
    expect(played).toEqual(["e5", "e4", "e3", "e2", "e1", "e5", "e4"]);
  });

  it("a last id no longer in the list starts again at the newest", () => expect(nextWhisper(five, "gone")?.echoId).toBe("e5"));
});

describe("addWhisper", () => {
  it("a live echo goes first and the list keeps the five newest", () => {
    const list = addWhisper(five, w("e6"));
    expect(list.map((x) => x.echoId)).toEqual(["e6", "e5", "e4", "e3", "e2"]);
    expect(list).toHaveLength(WHISPER_COUNT);
  });

  it("an echo already in the list is not added twice", () =>
    expect(addWhisper(five, w("e3")).map((x) => x.echoId)).toEqual(["e5", "e4", "e3", "e2", "e1"]));
});
