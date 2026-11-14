import { describe, expect, it } from "vitest";
import { PLACE_ID, placeId, type PlaceIn } from "@lampa/shared";
import { NEW_PLACE_VOICE, greeting, placeSiteFile } from "./content.js";

const PLACE: PlaceIn = {
  name: { ro: "Bastionul Theresia", en: "Theresia Bastion" },
  lat: 45.7537,
  lng: 21.2317,
  facts: [
    { text: "The bastion is the largest remaining piece of the city walls.", source: "https://example.org/a" },
    { text: "It was built in the eighteenth century by the Habsburgs.", source: "https://example.org/b" },
  ],
  persona: "An old brick wall that remembers the soldiers and the markets.",
  interactions: ["talk", "colours"],
};

describe("placeId", () => {
  it("the id strips diacritics", () => {
    expect(placeId("Piața Unirii Ștefan")).toBe("piata-unirii-stefan");
  });

  it("the id joins words with one dash", () => {
    expect(placeId("  Old   Tram -- Depot!  ")).toBe("old-tram-depot");
  });

  it("a name of only symbols gives an empty id", () => {
    expect(placeId("!?* ---")).toBe("");
    expect(PLACE_ID.test(placeId("!?* ---"))).toBe(false);
  });

  it("the id is at most 40 characters and does not end in a dash", () => {
    const id = placeId("a".repeat(39) + " bastion");
    expect(id).toBe("a".repeat(39));
    expect(placeId("b".repeat(60))).toHaveLength(40);
  });
});

describe("placeSiteFile", () => {
  it("the greeting is the name only, in Romanian and English", () => {
    expect(greeting(PLACE.name)).toEqual({
      ro: "Bună seara. Sunt Bastionul Theresia.",
      en: "Good evening. I am Theresia Bastion.",
    });
    expect(placeSiteFile("theresia-bastion", PLACE).persona.first_message).toEqual(greeting(PLACE.name));
  });

  it("placeSiteFile is never a memorial", () => {
    expect(placeSiteFile("theresia-bastion", PLACE).is_memorial).toBe(false);
  });

  it("placeSiteFile uses MX's voice", () => {
    const site = placeSiteFile("theresia-bastion", PLACE);
    expect(site.persona.voice).toBe(NEW_PLACE_VOICE);
    expect(NEW_PLACE_VOICE).toBe("2V7k6GOisfFlHlBdz8ec");
    expect(site.persona.traits).toBe(PLACE.persona);
  });
});
