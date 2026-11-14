import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { speak, stopSpeaking } from "./speak";

function fakeSynth(speaking: boolean) {
  const synth = {
    speaking,
    pending: false,
    cancel: vi.fn(() => {
      synth.speaking = false;
    }),
    speak: vi.fn(),
  };
  vi.stubGlobal("speechSynthesis", synth);
  vi.stubGlobal("SpeechSynthesisUtterance", class { lang = ""; constructor(public text: string) {} });
  return synth;
}

describe("speak", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("with nothing speaking it neither cancels nor waits: the start stays inside the tap", () => {
    const synth = fakeSynth(false);
    stopSpeaking(); // as `ask` does
    void speak("a", "en");
    expect(synth.cancel).not.toHaveBeenCalled();
    expect(synth.speak).toHaveBeenCalledOnce();
  });

  it("after a cancel it cancels once and starts on the next task, not in the same tick", () => {
    const synth = fakeSynth(true);
    stopSpeaking();
    void speak("a", "en");
    expect(synth.cancel).toHaveBeenCalledOnce();
    expect(synth.speak).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(synth.speak).toHaveBeenCalledOnce();
  });

  it("a stop before the put-off start drops it and resolves failed", async () => {
    const synth = fakeSynth(true);
    const said = speak("a", "en");
    stopSpeaking();
    vi.runAllTimers();
    expect(await said).toBe("failed");
    expect(synth.speak).not.toHaveBeenCalled();
  });
});
