import { t, type Lang } from "../i18n/t";

const roPlural = new Intl.PluralRules("ro");
/** Romanian "de " before a noun counted by `n`: exactly when its plural category is "other" (Patrick, hour 27). English has no {de} slot. */
export const roDe = (n: number): string => (roPlural.select(n) === "other" ? "de " : "");

/** The presence line under LampCounter L (DESIGN 6.13). `null` count, or a `null` return, hides the line. */
export function presenceLine(count: number | null, lit: boolean, site: string, lang: Lang): string | null {
  if (count === null) return null;
  const n = lit ? Math.max(1, count) : count; // 0 while lit: the visitor is lighting
  const others = n - 1;
  // Romanian "de" follows the number shown: n before lighting, n - 1 while lit (Patrick, hour 25)
  const de = roDe(lit ? others : n);
  if (lit) {
    if (n === 1) return t("lamp.presence_lit", { site }, lang);
    if (n === 2) return t("lamp.presence_lit_one", { site }, lang);
    return t("lamp.presence_lit_many", { others, de, site }, lang);
  }
  if (n === 0) return t("lamp.presence_none", { site }, lang);
  if (n === 1) return t("lamp.presence_one", { site }, lang);
  return t("lamp.presence_many", { n, de, site }, lang);
}
