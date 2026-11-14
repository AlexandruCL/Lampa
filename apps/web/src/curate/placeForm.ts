import { PLACE_ID, PlaceIn, placeId, type PlaceInteraction, type PublishStep } from "@lampa/shared";
import { ApiError } from "../api/client";
import { AuthApiError } from "../auth/authApi";
import type { DemoPlace } from "./demoPlace";
import { sessionEnded } from "./queue";

export const WEAK_ACCURACY_M = 30;
export const MAX_FACTS = 5;
const START_FACTS = 2;

export const INTERACTIONS: { value: PlaceInteraction; label: string }[] = [
  { value: "talk", label: "Talk" },
  { value: "colours", label: "Catch a colour" },
  { value: "echo", label: "Leave an echo" },
  { value: "lamp", label: "Raise a lamp" },
];

export type FactRow = { text: string; source: string };

/** What the inputs hold. Coordinates stay strings because the admin may type them. */
export type PlaceForm = {
  ro: string;
  en: string;
  lat: string;
  lng: string;
  facts: FactRow[];
  persona: string;
  interactions: PlaceInteraction[];
};

export function emptyForm(demo: DemoPlace | null = null): PlaceForm {
  return {
    ro: demo?.name.ro ?? "",
    en: demo?.name.en ?? "",
    lat: demo ? String(demo.lat) : "",
    lng: demo ? String(demo.lng) : "",
    facts: Array.from({ length: START_FACTS }, () => ({ text: "", source: "" })),
    persona: "",
    interactions: INTERACTIONS.map((i) => i.value),
  };
}

const blank = (s: string) => s.trim() === "";

/** Row indices that are validated and sent: the first two always, later rows only when something is typed. */
function keptRows(facts: FactRow[]): number[] {
  return facts.flatMap((f, i) => (i < START_FACTS || !blank(f.text) || !blank(f.source) ? [i] : []));
}

// Number("") is 0, a real latitude, so an empty field must stay missing.
const coordinate = (s: string) => (blank(s) ? NaN : Number(s));

export function toPlaceIn(form: PlaceForm): PlaceIn {
  return {
    name: { ro: form.ro, en: form.en },
    lat: coordinate(form.lat),
    lng: coordinate(form.lng),
    facts: keptRows(form.facts).map((i) => form.facts[i]!),
    persona: form.persona,
    interactions: form.interactions,
  };
}

export const MESSAGES = {
  name: "Enter a name of 2 to 60 characters.",
  location: "Add the place's location.",
  facts: "Add at least two facts.",
  factText: "Write 10 to 280 characters.",
  source: "Use a link that starts with https://.",
  persona: "Write 10 to 400 characters.",
  interactions: "Tick at least one interaction.",
  noAddress: "This name gives no page address. Use letters or numbers.",
} as const;

/** A field key; the input's DOM id is `place-` plus the key. */
export type FieldError = { field: string; message: string };

/** One message per invalid field, in the order the fields appear on the form. */
export function validate(form: PlaceForm): FieldError[] {
  const rows = keptRows(form.facts);
  const errors = new Map<string, string>();
  const add = (field: string, message: string) => {
    if (!errors.has(field)) errors.set(field, message);
  };
  const result = PlaceIn.safeParse(toPlaceIn(form));
  for (const issue of result.success ? [] : result.error.issues) {
    const [key, sub, part] = issue.path;
    if (key === "name") add(`name-${String(sub)}`, MESSAGES.name);
    else if (key === "lat" || key === "lng") add("location", MESSAGES.location);
    else if (key === "facts" && typeof sub === "number")
      add(`fact-${rows[sub]}-${String(part)}`, part === "text" ? MESSAGES.factText : MESSAGES.source);
    else if (key === "facts") add("facts", MESSAGES.facts);
    else if (key === "persona") add("persona", MESSAGES.persona);
    else if (key === "interactions") add("interactions", MESSAGES.interactions);
  }
  if (!errors.has("name-en") && !PLACE_ID.test(placeId(form.en))) add("name-en", MESSAGES.noAddress);

  const order = [
    "name-ro",
    "name-en",
    "location",
    "facts",
    ...form.facts.flatMap((_, i) => [`fact-${i}-text`, `fact-${i}-source`]),
    "persona",
    "interactions",
  ];
  return order.flatMap((field) => {
    const message = errors.get(field);
    return message ? [{ field, message }] : [];
  });
}

export type StepKey = "save" | PublishStep;

export const STEPS: { key: StepKey; label: string }[] = [
  { key: "save", label: "Saving place" },
  { key: "greeting", label: "Generating greeting" },
  { key: "bed", label: "Generating sound bed" },
  { key: "live", label: "Publishing" },
];

/** Publishing a site that is already live means an earlier try got there. */
export function stepDone(step: StepKey, err: unknown): boolean {
  return step === "live" && err instanceof AuthApiError && err.status === 409 && err.code === "already_published";
}

const FAILED = "That did not save. Try again.";

/** "ended" shows the session Notice; `unlock` lets the admin change the form and publish again. */
export function stepError(err: unknown): "ended" | { text: string; unlock: boolean } {
  if (sessionEnded(err) || (err instanceof ApiError && err.status === 401)) return "ended";
  if (!(err instanceof ApiError)) return { text: FAILED, unlock: false };
  const code = err instanceof AuthApiError ? err.code : undefined;
  switch (err.status) {
    case 403:
      return { text: "This account cannot publish places.", unlock: true };
    case 409:
      if (code === "site_exists")
        return { text: "A place with this page address already exists. Change the English name.", unlock: true };
      if (code === "over_cap") return { text: "This would use more than 2,000 credits. Nothing was generated.", unlock: false };
      return { text: FAILED, unlock: false };
    case 502:
      return { text: "The voice service did not answer. Try again; files already made are kept.", unlock: false };
    case 503:
      return { text: "The server is not ready. Try again in a minute.", unlock: false };
    case 429:
      return { text: "Too many places this hour. Try again later.", unlock: false };
    default:
      return { text: FAILED, unlock: false };
  }
}

export function qrUrl(origin: string, id: string): string {
  return `${origin}/s/${id}`;
}
