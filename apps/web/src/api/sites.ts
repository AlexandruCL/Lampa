import { SiteDetail } from "@lampa/shared";
import { LANG, type Lang } from "../i18n/t";
import type { PhoneSite } from "../sites/sites";
import { ApiError, api } from "./client";

/** GET /sites/:id. An unknown id (404) gives null; any other failure is thrown. */
export async function fetchSite(id: string, lang: Lang = LANG): Promise<PhoneSite | null> {
  try {
    const s = await api(`/sites/${encodeURIComponent(id)}?lang=${lang}`, { schema: SiteDetail });
    return {
      id: s.id,
      name: s.name,
      lat: s.lat,
      lng: s.lng,
      is_memorial: s.is_memorial,
      lamp: s.interactions.includes("lamp"),
      interactions: s.interactions,
    };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}
