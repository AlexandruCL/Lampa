import { t, type Lang } from "../i18n/t";

/** The presence line under LampCounter L (DESIGN 6.13). `null` count, or a `null` return, hides the line. */
export function presenceLine(count: number | null, lit: boolean, site: string, lang: Lang): string | null {
  if (count === null) return null;
  const n = lit ? Math.max(1, count) : count; // 0 while lit: the visitor is lighting
  const others = n - 1;
  // Romanian "de" follows the number shown: n before lighting, n - 1 while lit (Patrick, hour 25). English has no {de} slot.
  const de = (lit ? others : n) >= 20 ? "de " : "";
  if (lit) {
    if (n === 1) return t("lamp.presence_lit", { site }, lang);
    if (n === 2) return t("lamp.presence_lit_one", { site }, lang);
    return t("lamp.presence_lit_many", { others, de, site }, lang);
  }
  if (n === 0) return t("lamp.presence_none", { site }, lang);
  if (n === 1) return t("lamp.presence_one", { site }, lang);
  return t("lamp.presence_many", { n, de, site }, lang);
}
