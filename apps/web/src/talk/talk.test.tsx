import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Captions } from "./Captions";

const count = (s: string, part: string) => s.split(part).length - 1;

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
