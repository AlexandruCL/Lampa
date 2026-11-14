import { LANG, t, type Key, type Lang } from "../i18n/t";
import { WALK_M_PER_MIN } from "./score";

const mod360 = (x: number) => ((x % 360) + 360) % 360;

const roundMetres = (m: number) => Math.round(m / 10) * 10;
/** One decimal; Romanian uses a decimal comma (Ionut's decision, hour 23). */
const km = (m: number, lang: Lang) => {
  const s = (m / 1000).toFixed(1);
  return lang === "ro" ? s.replace(".", ",") : s;
};

/** "220 m" under 995 m, "1.2 km" ("1,2 km" in ro) from 995 m. */
export function formatDistance(m: number, lang: Lang = LANG): string {
  return m < 995 ? t("nav.metres", { n: roundMetres(m) }, lang) : t("nav.km", { n: km(m, lang) }, lang);
}

/** For a weak position: "about 300 m", never under 100. */
export function formatWeakDistance(m: number, lang: Lang = LANG): string {
  return t("nav.about_metres", { n: Math.max(100, Math.round(m / 100) * 100) }, lang);
}

export function walkMinutes(m: number): number {
  return Math.max(1, Math.ceil(m / WALK_M_PER_MIN));
}

/** "220 m, about 3 min walk". */
export function metaLine(m: number, lang: Lang = LANG): string {
  return t("nav.meta", { distance: formatDistance(m, lang), min: walkMinutes(m) }, lang);
}

const COMPASS: Key[] = [
  "nav.compass_north",
  "nav.compass_north_east",
  "nav.compass_east",
  "nav.compass_south_east",
  "nav.compass_south",
  "nav.compass_south_west",
  "nav.compass_west",
  "nav.compass_north_west",
];

/** "To the north-east": eight 45-degree sectors centred on the compass points. */
export function compassWord(bearing: number, lang: Lang = LANG): string {
  return t(COMPASS[Math.round(mod360(bearing) / 45) % 8], {}, lang);
}

/** -180 to under 180; 0 straight ahead, negative to the left. */
export function relativeAngle(bearing: number, heading: number): number {
  return mod360(bearing - heading + 540) - 180;
}

/** Ionut's decision, hour 7. */
export function spokenDirection(rel: number, lang: Lang = LANG): string {
  const a = Math.abs(rel);
  const left = rel < 0;
  if (a <= 15) return t("nav.ahead", {}, lang);
  if (a <= 60) return t(left ? "nav.ahead_left" : "nav.ahead_right", {}, lang);
  if (a <= 120) return t(left ? "nav.to_left" : "nav.to_right", {}, lang);
  return t("nav.behind", {}, lang);
}

/** "Muzeul MX Corneliu Miklosi, 220 metres, ahead and slightly left". */
export function spokenLine(name: string, m: number, direction: string, lang: Lang = LANG): string {
  const n = roundMetres(m);
  // Romanian drops "de" when the last two digits are 1 to 19, or for 0 ("110 metri", "220 de metri"): CLDR's "few".
  const distance =
    m >= 995
      ? t("nav.spoken_km", { n: km(m, lang) }, lang)
      : t(new Intl.PluralRules(lang).select(n) === "few" ? "nav.spoken_metres_few" : "nav.spoken_metres", { n }, lang);
  return t("nav.spoken_line", { name, distance, direction }, lang);
}

/** The angle equal to `next` mod 360 nearest to `previous`, so the arrow turns the short way (5.2). */
export function unwrapAngle(previous: number, next: number): number {
  return previous + relativeAngle(next, previous);
}
