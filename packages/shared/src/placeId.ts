/** English name → site id: lower case, diacritics stripped, every run of other characters → "-", trimmed, at most 40. */
export function placeId(nameEn: string): string {
  return nameEn
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}
