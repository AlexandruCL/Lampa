import { useEffect, useRef, useState } from "react";
import { Button, Icon, Notice, RoundControl } from "../components";
import { ECHO_MAX_MS, canRecord, openMicrophone, secondsLeft, startRecording } from "../echo/recorder";
import type { Recording } from "../echo/recording";
import { sendEcho, toEchoForm } from "../echo/upload";
import type { PhoneSite } from "../sites/sites";
import styles from "./EchoRecorder.module.css";
import { TopBar } from "./TopBar";

type Phase = "idle" | "recording" | "recorded" | "sent" | "denied" | "unavailable";

const ECHO_TICK_MS = 100;
const clock = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Echo recorder (DESIGN.md 7.6). Opened by the "Leave an echo" button or the client tool start_echo_recording(prompt). */
export function EchoRecorder({ site, demo, prompt, onBack, onSent }: { site: PhoneSite; demo: boolean; prompt?: string; onBack: () => void; onSent?: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => (canRecord() ? "idle" : "unavailable"));
  const [recording, setRecording] = useState<Recording | null>(null);
  const [now, setNow] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [short, setShort] = useState(false);
  const [consent, setConsent] = useState(false);
  const [info, setInfo] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const ctl = useRef<{ stop(): void } | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const mounted = useRef(true);
  const opening = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ctl.current?.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // One Audio element per recording; the object URL is revoked when the recording goes.
  useEffect(() => {
    if (!recording) return;
    const url = URL.createObjectURL(recording.blob);
    const a = new Audio(url);
    a.onended = () => setPlaying(false);
    audio.current = a;
    return () => {
      a.pause();
      URL.revokeObjectURL(url);
      audio.current = null;
      setPlaying(false);
    };
  }, [recording]);

  useEffect(() => {
    if (phase !== "recording") return;
    const tick = setInterval(() => setNow(performance.now()), ECHO_TICK_MS);
    // A page in the background stops the recording as a tap on stop would.
    const onVis = () => {
      if (document.hidden) ctl.current?.stop();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [phase]);

  const onDone = (r: Recording | null) => {
    ctl.current = null;
    stream.current = null;
    if (r) {
      setRecording(r);
      setPhase("recorded");
    } else {
      setShort(true);
      setPhase("idle");
    }
  };

  const begin = () => {
    if (opening.current) return;
    opening.current = true;
    const mic = openMicrophone(); // inside the tap: iOS needs it before any await
    setShort(false);
    void mic.then((m) => {
      opening.current = false;
      if (m.status !== "ready") {
        if (mounted.current) setPhase(m.status);
        return;
      }
      if (!mounted.current) {
        m.stream.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = m.stream;
      const h = startRecording(m.stream, onDone);
      ctl.current = h;
      setRecording(null);
      setFailed(false);
      setStartedAt(h.startedAt);
      setNow(h.startedAt);
      setPhase("recording");
    });
  };

  const send = async () => {
    if (!recording || sending) return;
    setSending(true);
    setFailed(false);
    try {
      await sendEcho(toEchoForm(recording, site.id, prompt));
      navigator.vibrate?.([20]);
      onSent?.();
      if (mounted.current) {
        setRecording(null);
        setPhase("sent");
      }
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      if (mounted.current) setSending(false);
    }
  };

  const togglePlay = () => {
    const a = audio.current;
    if (!a) return;
    if (playing) a.pause();
    else void a.play();
    setPlaying(!playing);
  };

  const leave = () => (recording && phase !== "sent" ? setLeaving(true) : onBack());
  const back = (
    <Button variant="secondary" size="l" block onClick={leave}>
      Back to {site.name}
    </Button>
  );
  const elapsed = Math.min(ECHO_MAX_MS, Math.max(0, now - startedAt));
  const off = <RoundControl state="disabled" label="Microphone is off" />;

  let body;
  let bottom = null;
  if (phase === "sent") {
    body = <p className={styles.prompt} role="status">Sent. A curator listens to it before it plays here.</p>;
    bottom = <Button variant="primary" size="l" block onClick={onBack}>Back to {site.name}</Button>;
  } else if (phase === "unavailable") {
    body = (
      <>
        {off}
        <p className={styles.line}>This browser cannot record an echo.</p>
      </>
    );
    bottom = back;
  } else if (phase === "denied") {
    body = (
      <>
        {off}
        <p className={styles.line}>LAMPA needs the microphone to record an echo. Allow the microphone in your browser settings, then try again.</p>
      </>
    );
    bottom = (
      <>
        <Button variant="secondary" size="l" block onClick={begin}>Try again</Button>
        {back}
      </>
    );
  } else {
    body = (
      <>
        <p className={styles.prompt}>{prompt ?? "Leave a memory of this place. Up to 20 seconds."}</p>
        {failed && <Notice variant="error">Your echo did not send. It is still here.</Notice>}
        {phase === "recorded" && recording ? (
          <div className={styles.preview}>
            <Button variant="icon" icon={playing ? "pause" : "play"} aria-label={playing ? "Pause echo" : "Play echo"} onClick={togglePlay} />
            <span className={styles.duration}>{clock(recording.durationMs)}</span>
          </div>
        ) : phase === "recording" ? (
          <RoundControl
            state="recording"
            status="Recording"
            label={`Recording, ${secondsLeft(elapsed)} s left`}
            progress={elapsed / ECHO_MAX_MS}
            onPress={() => ctl.current?.stop()}
          />
        ) : (
          <RoundControl state="idle" label="Tap to record" onPress={begin} />
        )}
        {short && phase === "idle" && <p className={styles.short}>That was too short to send. Record again.</p>}
        <label className={styles.consent}>
          <span className={styles.box}>
            <input type="checkbox" checked={consent} disabled={sending} onChange={(e) => setConsent(e.target.checked)} />
            <span className={styles.tick}><Icon name="check" /></span>
          </span>
          Play my voice here in public after a curator listens to it.
        </label>
        <Button variant="quiet" aria-expanded={info} onClick={() => setInfo(!info)}>What happens to my voice</Button>
        {info && (
          <p className={styles.info}>
            Your recording is stored on our server and transcribed. A curator listens to it. If approved, visitors here hear it in your voice. If rejected, it never plays. We do not ask for your name.
          </p>
        )}
      </>
    );
    if (leaving) {
      bottom = (
        <>
          <p className={styles.ask}>Discard this echo?</p>
          <div className={styles.row}>
            <Button variant="danger" onClick={onBack}>Discard</Button>
            <Button variant="secondary" onClick={() => setLeaving(false)}>Keep recording</Button>
          </div>
        </>
      );
    } else if (phase === "recorded") {
      bottom = (
        <>
          <Button variant="primary" size="l" block loading={sending} disabled={!consent && !sending} aria-describedby={consent ? undefined : "echo-hint"} onClick={send}>
            {sending ? "Sending" : failed ? "Try again" : "Send echo"}
          </Button>
          {!consent && <p id="echo-hint" className={styles.hint}>Tick the box to send.</p>}
          <Button variant="secondary" size="l" block disabled={sending} onClick={begin}>Record again</Button>
          {back}
        </>
      );
    } else if (phase === "idle") bottom = back;
  }

  return (
    <main className={styles.view}>
      <TopBar siteName={site.name} onBack={leave} demo={demo} />
      <div className={styles.body}>{body}</div>
      {bottom && <div className={styles.bottom}>{bottom}</div>}
    </main>
  );
}
