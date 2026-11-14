import { ConversationProvider } from "@elevenlabs/react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { stopClip } from "../audio/clip";
import { caughtClink, readingTone, windowChord } from "../audio/note";
import { Button, Notice, RoundControl } from "../components";
import { ColourLens } from "../phone/ColourLens";
import type { WindowPanes } from "../phone/panes";
import { TopBar } from "../phone/TopBar";
import { openRearCamera, type CameraResult } from "../sensors/camera";
import type { PhoneSite } from "../sites/sites";
import { Captions } from "./Captions";
import { visitorLang } from "./lang";
import { questionsFor, type Question } from "./questions";
import { speak, stopSpeaking } from "./speak";
import styles from "./Talk.module.css";
import { LENS_CLOSED, caughtLine } from "./tools";
import { playDuckedClip, useLiveTalk } from "./useLiveTalk";

type Props = {
  site: PhoneSite;
  demo: boolean;
  remote: boolean;
  mic: Promise<"granted" | "denied">;
  onBack: () => void;
  panes: WindowPanes;
  addPane: (pane: { windowId: string; slot: number; hex: string }) => void;
};

/** DESIGN 7.3. The only place the conversation SDK is rendered. */
export function Talk(props: Props) {
  return (
    <ConversationProvider>
      <TalkScreen {...props} />
    </ConversationProvider>
  );
}

function TalkScreen({ site, demo, remote, mic, onBack, panes, addPane }: Props) {
  const [lang] = useState(() => visitorLang(navigator.language));
  const talk = useLiveTalk(site, lang, mic);
  const { conversation, mode } = talk;
  const [held, setHeld] = useState(false);
  const [handsFree, setHandsFree] = useState(false);
  const [open, setOpen] = useState(false); // hands-free: the mic is on
  const [camera, setCamera] = useState<Promise<CameraResult> | null>(null);
  const live = mode === "live";
  const micOn = handsFree ? open : held;

  // hold to talk: muted from connect, open only while held (or while hands-free is on)
  useEffect(() => {
    if (live) conversation.setMuted(!micOn);
  }, [live, micOn]); // eslint-disable-line react-hooks/exhaustive-deps

  const state = !live ? "connecting" : held ? "listening" : conversation.isSpeaking ? "speaking" : micOn ? "listening" : "idle";
  const label =
    live && handsFree
      ? open ? "Tap to stop" : "Tap to talk"
      : { connecting: "Connecting", listening: "Listening", speaking: "Hold to interrupt", idle: "Hold to talk" }[state];

  const leave = () => {
    conversation.endSession();
    onBack();
  };

  // tap-to-ask: one answer at a time; `turn` drops results of a stopped answer (a cancel resolves speak "failed")
  const [questions] = useState(() => questionsFor(site.id, lang));
  const [playing, setPlaying] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const turn = useRef(0);
  useEffect(
    () => () => {
      stopClip();
      stopSpeaking();
    },
    [],
  );
  const ask = (q: Question) => {
    const t = ++turn.current;
    stopClip();
    stopSpeaking();
    setFailed(false);
    if (playing === q.id) return setPlaying(null);
    setPlaying(q.id);
    talk.addAnswer(q.a);
    const done = (end: "ended" | "stopped" | "failed") => {
      if (turn.current !== t) return;
      setPlaying(null);
      setFailed(end === "failed");
    };
    // no file: speak inside the tap, iOS wants a gesture for the browser voice
    const voice = () => speak(q.a, lang).then(done);
    if (!q.file) return void voice();
    void playDuckedClip(q.file, true).then((end) => (end === "failed" && turn.current === t ? voice() : done(end)));
  };

  return (
    <>
      <div className={styles.tint} style={{ backgroundColor: talk.light?.hex, opacity: talk.light?.alpha ?? 0 }} aria-hidden="true" />
      <main className={styles.page}>
        <TopBar siteName={site.name} onBack={leave} demo={demo} />
        <div className={styles.body}>
          <Captions name={site.name} lines={talk.lines} timeUp={talk.timeUp} tapToAsk={mode === "fallback" || mode === "timeup"} />
          <div className={styles.actions}>
            {live && talk.catchWaiting && !camera && (
              <Button
                variant="primary"
                size="l"
                block
                onClick={() => setCamera(openRearCamera())} // inside the tap: iOS needs it before any await
              >
                Catch a colour
              </Button>
            )}
            {(mode === "fallback" || mode === "timeup") && (
              <TapToAsk
                questions={questions}
                notice={mode === "fallback" ? talk.notice : null}
                playing={playing}
                failed={failed}
                onTap={ask}
              />
            )}
            {(mode === "connecting" || live) && (
              <>
                <TalkControl
                  state={state}
                  label={label}
                  getLevel={conversation.getInputVolume}
                  onPress={() => {
                    if (!live) return; // connecting: holding does nothing
                    if (handsFree) setOpen((o) => !o);
                    else setHeld(true);
                  }}
                  onRelease={() => setHeld(false)}
                />
                <Button
                  variant="secondary"
                  aria-pressed={handsFree}
                  onClick={() => {
                    setHandsFree(!handsFree);
                    setOpen(!handsFree);
                    setHeld(false);
                  }}
                >
                  Hands-free
                </Button>
              </>
            )}
            <Button variant="quiet" onClick={leave}>
              End conversation
            </Button>
          </div>
        </div>
      </main>
      {camera && (
        <ColourLens
          site={site}
          remote={remote}
          demo={demo}
          camera={camera}
          onReading={readingTone}
          // the lens stays open on a catch; Back closes it and settles only a call still waiting
          onCaught={(reading) => {
            caughtClink(reading);
            talk.settleCatch(caughtLine(reading.hex));
          }}
          onComplete={() => windowChord(panes.filled)}
          onBack={() => {
            talk.settleCatch(LENS_CLOSED);
            setCamera(null);
          }}
          panes={panes}
          addPane={addPane}
        />
      )}
    </>
  );
}

const NOTICE = {
  resting: "Live conversation is resting. Tap a question.",
  mic_off: "The microphone is off, so the monument cannot hear you. Tap a question instead, or allow the microphone in your browser settings.",
};

/** DESIGN 7.3 fallback and time-up: one button per question; `notice` is null at time-up. */
export function TapToAsk({
  questions,
  notice,
  playing,
  failed,
  onTap,
}: {
  questions: Question[];
  notice: "resting" | "mic_off" | null;
  playing: string | null;
  failed: boolean;
  onTap: (q: Question) => void;
}) {
  return (
    <div className={styles.questions}>
      {notice && questions.length === 0 ? (
        notice === "mic_off" ? (
          <Notice variant="error">
            The microphone is off, so the monument cannot hear you. Allow the microphone in your browser settings, then try again.
          </Notice>
        ) : (
          <Notice variant="info">Live conversation is resting. Try again in a few minutes.</Notice>
        )
      ) : (
        notice && <Notice variant={notice === "resting" ? "info" : "error"}>{NOTICE[notice]}</Notice>
      )}
      {failed && <Notice variant="error">Could not play the answer. Here it is as text.</Notice>}
      {questions.map((q) => (
        <Button key={q.id} variant="secondary" size="l" block icon={playing === q.id ? "pause" : undefined} onClick={() => onTap(q)}>
          {playing === q.id ? "Playing" : q.q}
        </Button>
      ))}
    </div>
  );
}

/** RoundControl with the mic level read once per animation frame while listening; a leaf so Captions do not re-render each frame. */
function TalkControl({ getLevel, ...props }: ComponentProps<typeof RoundControl> & { getLevel: () => number }) {
  const [level, setLevel] = useState(0);
  const get = useRef(getLevel);
  get.current = getLevel;
  useEffect(() => {
    if (props.state !== "listening") return;
    let id = requestAnimationFrame(function tick() {
      setLevel(get.current());
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [props.state]);
  return <RoundControl {...props} level={level} />;
}
