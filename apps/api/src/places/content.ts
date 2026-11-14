import type { PlaceIn } from "@lampa/shared";
import { SiteFile } from "../db/seed.js";

export const NEW_PLACE_VOICE = "2V7k6GOisfFlHlBdz8ec"; // MX's persona.voice
export const NEW_PLACE_CITY = "timisoara";
export const NEW_PLACE_RADIUS_M = 40;
export const NEW_PLACE_GLOW_K = 5;
export const PLACE_LIMIT = 10;
export const PLACE_WINDOW_MS = 3_600_000;
export const PLACE_MAX_CREDITS = 2000;

type Name = PlaceIn["name"];

export const greeting = (name: Name) => ({
  ro: "Bună seara. Sunt " + name.ro + ".",
  en: "Good evening. I am " + name.en + ".",
});

export const bedPrompt = (nameEn: string) =>
  "Quiet evening city ambience at " + nameEn + ", Timișoara, calm steady ambient loop, no speech, no music";

export function placeSiteFile(id: string, place: PlaceIn): SiteFile {
  const { name } = place;
  return SiteFile.parse({
    id,
    city: NEW_PLACE_CITY,
    name,
    location: { lat: place.lat, lng: place.lng },
    radius_m: NEW_PLACE_RADIUS_M,
    interactions: place.interactions,
    is_memorial: false,
    glow_k: NEW_PLACE_GLOW_K,
    persona: { name, voice: NEW_PLACE_VOICE, traits: place.persona, first_message: greeting(name) },
    facts: place.facts,
    sound_bed: bedPrompt(name.en),
    directions_hint: {},
    active: { from: null, until: null },
  });
}
