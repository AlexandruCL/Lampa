import { PlaceDraft, placeId, PublishOut, type PlaceInteraction } from "@lampa/shared";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { authApi, postJson } from "../auth/authApi";
import { Button, Icon } from "../components";
import { DEMO_PLACE } from "./demoPlace";
import {
  emptyForm,
  INTERACTIONS,
  MAX_FACTS,
  qrUrl,
  STEPS,
  stepDone,
  stepError,
  toPlaceIn,
  validate,
  WEAK_ACCURACY_M,
  type FieldError,
  type PlaceForm,
} from "./placeForm";
import { PlaceQR } from "./PlaceQR";
import { PublishSteps, type StepState } from "./PublishSteps";
import styles from "./AddPlace.module.css";

type Props = { getToken: () => Promise<string>; onSessionEnded: () => void };

const demoPlace = () => (new URLSearchParams(window.location.search).get("demo") === "1" ? DEMO_PLACE : null);

/** DESIGN.md 7.15 "Add a place": the admin fills it at the place, publishes it and gets its QR code. */
export function AddPlace({ getToken, onSessionEnded }: Props) {
  const [form, setForm] = useState<PlaceForm>(() => emptyForm(demoPlace()));
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [focusField, setFocusField] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationOff, setLocationOff] = useState(false);
  const [steps, setSteps] = useState<StepState[] | null>(null);
  const [locked, setLocked] = useState(false);
  const [published, setPublished] = useState<{ id: string; name: string } | null>(null);
  const draftId = useRef("");
  const running = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusField) return;
    setFocusField(null);
    document.getElementById(`place-${focusField}`)?.focus();
  }, [focusField]);

  useEffect(() => {
    if (published) successRef.current?.focus();
  }, [published]);

  const set = (patch: Partial<PlaceForm>) => setForm((f) => ({ ...f, ...patch }));
  const setFact = (i: number, patch: Partial<PlaceForm["facts"][number]>) =>
    setForm((f) => ({ ...f, facts: f.facts.map((row, j) => (j === i ? { ...row, ...patch } : row)) }));
  const toggle = (value: PlaceInteraction, on: boolean) =>
    setForm((f) => ({
      ...f,
      interactions: INTERACTIONS.map((i) => i.value).filter((v) => (v === value ? on : f.interactions.includes(v))),
    }));

  const message = (field: string) => errors.find((e) => e.field === field)?.message;
  /** id, aria-invalid and aria-describedby for one input; `help` is the id of a helper line under it. */
  const aria = (field: string, id = `place-${field}`, help?: string) => {
    const describedBy = [help, message(field) && `place-${field}-error`].filter(Boolean).join(" ");
    return { id, "aria-invalid": message(field) ? true : undefined, "aria-describedby": describedBy || undefined };
  };
  const errorLine = (field: string): ReactNode => {
    const text = message(field);
    return (
      text && (
        <p className={styles.fieldError} id={`place-${field}-error`}>
          <Icon name="alert" size={20} />
          {text}
        </p>
      )
    );
  };

  const locate = () => {
    if (!navigator.geolocation) return setLocationOff(true);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocationOff(false);
        setAccuracy(Math.round(pos.coords.accuracy));
        set({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
      },
      () => {
        setLocating(false);
        setLocationOff(true);
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  const setStep = (i: number, state: StepState) => setSteps((s) => s && s.map((old, j) => (j === i ? state : old)));

  /** Runs the steps from `from` on; a failed step stops the run and waits for "Try again". */
  const run = async (from: number) => {
    if (running.current) return;
    running.current = true;
    setLocked(true);
    const place = toPlaceIn(form);
    try {
      for (let i = from; i < STEPS.length; i++) {
        const { key } = STEPS[i]!;
        setStep(i, { status: "active" });
        try {
          const token = await getToken();
          if (key === "save") {
            const draft = await authApi("/sites", token, PlaceDraft, postJson(place));
            if (!draft) throw new Error("POST /sites answered without a draft");
            draftId.current = draft.id;
          } else {
            await authApi(`/sites/${encodeURIComponent(draftId.current)}/publish`, token, PublishOut, postJson({ step: key }));
          }
        } catch (err) {
          if (!stepDone(key, err)) {
            const failure = stepError(err);
            if (failure === "ended") return onSessionEnded();
            setStep(i, { status: "failed", error: failure.text });
            if (failure.unlock) setLocked(false);
            return;
          }
        }
        setStep(i, { status: "done" });
      }
      setPublished({ id: draftId.current, name: place.name.en.trim() });
    } finally {
      running.current = false;
    }
  };

  const submit = () => {
    if (running.current) return;
    const found = validate(form);
    setErrors(found);
    const first = found[0]?.field;
    if (first) {
      setFocusField(first === "location" ? (locationOff ? "lat" : "locate") : first === "facts" ? "fact-0-text" : first);
      return;
    }
    setSteps(STEPS.map(() => ({ status: "pending" })));
    void run(0);
  };

  const reset = () => {
    setForm(emptyForm());
    setErrors([]);
    setAccuracy(null);
    setLocationOff(false);
    setSteps(null);
    setLocked(false);
    setPublished(null);
    draftId.current = "";
    setFocusField("name-ro");
  };

  const id = placeId(form.en);
  const url = published && qrUrl(window.location.origin, published.id);

  return (
    <div className={styles.placeForm}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset className={styles.lock} disabled={locked}>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="place-name-ro">
              Name in Romanian
            </label>
            <input className={styles.fieldInput} {...aria("name-ro")} lang="ro" required value={form.ro} onChange={(e) => set({ ro: e.target.value })} />
            {errorLine("name-ro")}
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="place-name-en">
              Name in English
            </label>
            <input className={styles.fieldInput} {...aria("name-en", undefined, "place-page")} required value={form.en} onChange={(e) => set({ en: e.target.value })} />
            <p className={styles.fieldMeta} id="place-page">
              Page: /s/{id}
            </p>
            {errorLine("name-en")}
          </div>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Location</legend>
            <div className={styles.actions}>
              <Button variant="secondary" size="l" id="place-locate" loading={locating} onClick={locate}>
                Use my location
              </Button>
            </div>
            {locationOff && (
              <p className={styles.fieldHelp} role="status">
                Location is off. Allow it in your browser settings, or type the coordinates.
              </p>
            )}
            <div className={styles.coords}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="place-lat">
                  Latitude
                </label>
                <input
                  className={styles.fieldInput}
                  {...aria("location", "place-lat")}
                  inputMode="decimal"
                  readOnly={!locationOff}
                  value={form.lat}
                  onChange={(e) => set({ lat: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="place-lng">
                  Longitude
                </label>
                <input
                  className={styles.fieldInput}
                  {...aria("location", "place-lng")}
                  inputMode="decimal"
                  readOnly={!locationOff}
                  value={form.lng}
                  onChange={(e) => set({ lng: e.target.value })}
                />
              </div>
            </div>
            {accuracy !== null && <p className={styles.fieldMeta}>accuracy {accuracy} m</p>}
            {accuracy !== null && accuracy > WEAK_ACCURACY_M && (
              <p className={styles.fieldHelp}>Accuracy is {accuracy} m. Move into the open and try again for a better fix.</p>
            )}
            {errorLine("location")}
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Facts</legend>
            {errorLine("facts")}
            {form.facts.map((fact, i) => (
              <div className={styles.fact} key={i}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`place-fact-${i}-text`}>
                    Fact {i + 1}
                  </label>
                  <textarea className={styles.fieldInput} {...aria(`fact-${i}-text`)} value={fact.text} onChange={(e) => setFact(i, { text: e.target.value })} />
                  {errorLine(`fact-${i}-text`)}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor={`place-fact-${i}-source`}>
                    Source URL
                  </label>
                  <input
                    className={styles.fieldInput}
                    {...aria(`fact-${i}-source`)}
                    type="url"
                    inputMode="url"
                    value={fact.source}
                    onChange={(e) => setFact(i, { source: e.target.value })}
                  />
                  {errorLine(`fact-${i}-source`)}
                </div>
              </div>
            ))}
            {form.facts.length < MAX_FACTS && (
              <div className={styles.actions}>
                <Button
                  variant="quiet"
                  onClick={() => {
                    set({ facts: [...form.facts, { text: "", source: "" }] });
                    setFocusField(`fact-${form.facts.length}-text`);
                  }}
                >
                  Add a fact
                </Button>
              </div>
            )}
          </fieldset>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="place-persona">
              Persona description
            </label>
            <textarea className={styles.fieldInput} {...aria("persona", undefined, "place-persona-help")} value={form.persona} onChange={(e) => set({ persona: e.target.value })} />
            <p className={styles.fieldHelp} id="place-persona-help">
              How the place speaks: slow, proud, a little deaf.
            </p>
            {errorLine("persona")}
          </div>

          <fieldset className={styles.group} aria-describedby={message("interactions") ? "place-interactions-error" : undefined}>
            <legend className={styles.legend}>Interactions</legend>
            {INTERACTIONS.map(({ value, label }, i) => (
              <label className={styles.check} key={value}>
                <span className={styles.checkBox}>
                  <input
                    className={styles.checkInput}
                    id={i === 0 ? "place-interactions" : undefined}
                    type="checkbox"
                    value={value}
                    checked={form.interactions.includes(value)}
                    onChange={(e) => toggle(value, e.target.checked)}
                  />
                  <span className={styles.checkMark}>
                    <Icon name="check" />
                  </span>
                </span>
                {label}
              </label>
            ))}
            {errorLine("interactions")}
          </fieldset>

          <div className={styles.actions}>
            <Button variant="primary" size="l" type="submit">
              Publish place
            </Button>
          </div>
        </fieldset>
      </form>

      {steps && <PublishSteps steps={steps} onRetry={(i) => (i === 0 ? submit() : void run(i))} />}

      {published && url && (
        <div className={styles.success} ref={successRef} tabIndex={-1}>
          <PlaceQR url={url} />
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => window.open(url, "_blank", "noopener")}>
              Open {published.name}
            </Button>
            <Button variant="quiet" onClick={reset}>
              Add another place
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
