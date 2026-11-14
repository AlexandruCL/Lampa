import en from "./en.json";
import ro from "./ro.json";

export type Lang = "en" | "ro";
export type Key = keyof typeof en;

/** "ro" when `navigator.language` starts with "ro", else "en" (Ionut's decision, hour 23). */
export function pickLang(navigatorLanguage: string | undefined): Lang {
  return (navigatorLanguage ?? "").toLowerCase().startsWith("ro") ? "ro" : "en";
}

/** The page's language, read once at load. No in-app switch. */
export const LANG: Lang = pickLang(typeof navigator === "undefined" ? undefined : navigator.language);
// Screen readers pick their voice from <html lang>.
if (typeof document !== "undefined") document.documentElement.lang = LANG;

const DICTS: Record<Lang, Partial<Record<Key, string>>> = { en, ro };

/** One UI string in `lang` (English when ro lacks the key), with `{name}` slots filled from `vars`. */
export function t(key: Key, vars: Record<string, string | number> = {}, lang: Lang = LANG): string {
  const s = DICTS[lang][key] ?? en[key];
  return s.replace(/\{(\w+)\}/g, (slot, name: string) => (name in vars ? String(vars[name]) : slot));
}

/** A site's name in `lang`: a `site_name.<id>` key when the dictionary has one, else `site.name` as `sites.json` or `GET /sites/:id` gives it (Ionut's decision, hour 37). */
export function siteName(site: { id: string; name: string }, lang: Lang = LANG): string {
  const key = `site_name.${site.id}`;
  return key in en ? t(key as Key, {}, lang) : site.name;
}
