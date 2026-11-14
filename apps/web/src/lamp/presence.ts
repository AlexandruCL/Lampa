/** The presence line under LampCounter L (DESIGN 6.13). `null` count, or a `null` return, hides the line. */
export function presenceLine(count: number | null, lit: boolean, site: string, lang: "en" | "ro"): string | null {
  if (count === null) return null;
  const n = lit ? Math.max(1, count) : count; // 0 while lit: the visitor is lighting
  // Romanian "de" follows the number shown: n before lighting, n - 1 while lit (Patrick, hour 25).
  const de = (lit ? n - 1 : n) >= 20 ? "de " : "";
  if (lang === "ro") {
    if (lit) {
      if (n === 1) return `Tu aprinzi ${site}.`;
      if (n === 2) return `Tu și încă o persoană aprindeți ${site} acum.`;
      return `Tu și încă ${n - 1} ${de}persoane aprindeți ${site} acum.`;
    }
    if (n === 0) return `Nimeni nu aprinde ${site} acum.`;
    if (n === 1) return `O persoană aprinde ${site} acum.`;
    return `${n} ${de}persoane aprind ${site} acum.`;
  }
  if (lit) {
    if (n === 1) return `You are lighting ${site}.`;
    if (n === 2) return `You and 1 other person are lighting ${site} now.`;
    return `You and ${n - 1} others are lighting ${site} now.`;
  }
  if (n === 0) return `Nobody is lighting ${site} right now.`;
  if (n === 1) return `1 person is lighting ${site} now.`;
  return `${n} people are lighting ${site} now.`;
}
