import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Captions } from "./Captions";
import type { Question } from "./questions";
import { TapToAsk } from "./Talk";

const count = (s: string, part: string) => s.split(part).length - 1;

const questions: Question[] = [
  { id: "q1", q: "Who built you?", a: "Builders.", file: "unirii/answer-q1-en.mp3" },
  { id: "q2", q: "What did you see?", a: "Trams.", file: null },
  { id: "q3", q: "Why the colours?", a: "Glass.", file: null },
];
const noop = () => {};

describe("TapToAsk", () => {
  it("fallback shows one button per question", () => {
    const out = renderToStaticMarkup(<TapToAsk questions={questions} notice="resting" playing="q2" failed={false} onTap={noop} />);
    expect(count(out, "<button")).toBe(3);
    expect(out).toContain("Live conversation is resting. Tap a question.");
    expect(out).toContain("Who built you?");
    expect(out).toContain("Playing");
    expect(out).not.toContain("What did you see?");
    expect(out).not.toContain("disabled");
  });

  it("fallback with no questions shows the resting line with try again", () => {
    const out = renderToStaticMarkup(<TapToAsk questions={[]} notice="resting" playing={null} failed={false} onTap={noop} />);
    expect(out).toContain("Live conversation is resting. Try again in a few minutes.");
    expect(out).not.toContain("Tap a question");
    expect(out).not.toContain("<button");
  });

  it("mic off shows the microphone notice", () => {
    const out = renderToStaticMarkup(<TapToAsk questions={questions} notice="mic_off" playing={null} failed={false} onTap={noop} />);
    expect(out).toContain("The microphone is off, so the monument cannot hear you.");
    expect(out).toContain('role="alert"');
    expect(count(out, "<button")).toBe(3);
  });
});

describe("Captions", () => {
  it("shows the empty state with the site name", () => {
    const out = renderToStaticMarkup(<Captions name="Piața Unirii" lines={[]} timeUp={false} />);
    expect(out).toContain("Piața Unirii is listening. Hold the button and ask anything.");
  });

  it("labels the visitor once and the AI voice once", () => {
    const out = renderToStaticMarkup(
      <Captions
        name="Piața Unirii"
        lines={[
          { key: "agent-1", role: "agent", text: "The square remembers the trams." },
          { key: "user-2", role: "user", text: "When did the trams come?" },
        ]}
        timeUp={false}
      />,
    );
    expect(count(out, ">You<")).toBe(1);
    expect(count(out, "AI voice")).toBe(1);
    expect(out).not.toContain("is listening");
  });

  it("is a labelled region, not a live region", () => {
    const out = renderToStaticMarkup(<Captions name="Piața Unirii" lines={[]} timeUp={false} />);
    expect(out).toContain('aria-label="Captions"');
    expect(out).not.toContain("aria-live");
  });
});
