import { ConversationProvider } from "@elevenlabs/react";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button, RoundControl } from "../components";
import { ColourLens } from "../phone/ColourLens";
import type { WindowPanes } from "../phone/panes";
import { TopBar } from "../phone/TopBar";
import { openRearCamera, type CameraResult } from "../sensors/camera";
import type { PhoneSite } from "../sites/sites";
import { Captions } from "./Captions";
import { visitorLang } from "./lang";
import styles from "./Talk.module.css";
import { LENS_CLOSED, caughtLine } from "./tools";
import { useLiveTalk } from "./useLiveTalk";

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
  // shortcut: hands-free "Tap to start" / "Tap to end" are placeholder copy from DESIGN 6.4's prose, until Patrick sets them
  const label =
    live && handsFree && state !== "listening"
      ? open ? "Tap to end" : "Tap to start"
      : { connecting: "Connecting", listening: "Listening", speaking: "Hold to interrupt", idle: "Hold to talk" }[state];

  const leave = () => {
    conversation.endSession();
    onBack();
  };
  const closeLens = (answer: string) => {
    talk.settleCatch(answer);
    setCamera(null);
  };

  return (
    <>
      <div className={styles.tint} style={{ backgroundColor: talk.light?.hex, opacity: talk.light?.alpha ?? 0 }} aria-hidden="true" />
      <main className={styles.page}>
        <TopBar siteName={site.name} onBack={leave} demo={demo} />
        <div className={styles.body}>
          <Captions name={site.name} lines={talk.lines} timeUp={talk.timeUp} />
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
            {/* TODO(B2-2.b): fallback and timeup show the tap-to-ask questions and talk.notice here */}
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
          onCaught={(reading) => closeLens(caughtLine(reading.hex))}
          onBack={() => closeLens(LENS_CLOSED)}
          panes={panes}
          addPane={addPane}
        />
      )}
    </>
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
