import { PlaceIn } from "@lampa/shared";
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/client";
import { AuthApiError } from "../auth/authApi";
import { emptyForm, MESSAGES, qrUrl, stepDone, stepError, toPlaceIn, validate, type PlaceForm } from "./placeForm";

const fact = (n: number) => ({ text: `A true thing about this place, number ${n}.`, source: `https://example.org/${n}` });

function complete(): PlaceForm {
  return {
    ...emptyForm(),
    ro: "Podul Decebal",
    en: "Decebal Bridge",
    lat: "45.7489",
    lng: "21.2283",
    facts: [fact(1), fact(2)],
    persona: "Slow, proud, a little deaf.",
  };
}

describe("placeForm", () => {
  it("a complete form gives a valid PlaceIn", () => {
    const form = complete();
    expect(validate(form)).toEqual([]);
    const place = PlaceIn.parse(toPlaceIn(form));
    expect(place.lat).toBe(45.7489);
    expect(place.facts).toHaveLength(2);
    expect(place.interactions).toEqual(["colours", "lamp"]);
  });

  it("one fact is invalid", () => {
    const form = complete();
    form.facts[1] = { ...fact(2), text: "Too short" };
    expect(validate(form)).toEqual([{ field: "fact-1-text", message: MESSAGES.factText }]);
  });

  it("an http source is invalid", () => {
    const form = complete();
    form.facts[0] = { ...fact(1), source: "http://example.org/1" };
    expect(validate(form)).toEqual([{ field: "fact-0-source", message: MESSAGES.source }]);
  });

  it("a name of symbols gives the page-address message", () => {
    const form = { ...complete(), en: "!!! ???" };
    expect(validate(form)).toEqual([{ field: "name-en", message: MESSAGES.noAddress }]);
  });

  it("the first invalid field is named first", () => {
    const form = { ...complete(), ro: "", en: "@@", lat: "", interactions: [] };
    expect(validate(form).map((e) => e.field)).toEqual(["name-ro", "name-en", "location", "interactions"]);
    expect(validate(form)[1]!.message).toBe(MESSAGES.noAddress);
  });

  it("empty fact rows past the second are dropped before validation", () => {
    const form = complete();
    form.facts.push({ text: "", source: " " }, fact(4), { text: "", source: "" });
    expect(validate(form)).toEqual([]);
    expect(toPlaceIn(form).facts).toEqual([fact(1), fact(2), fact(4)]);
    // A row past the second with a typo keeps its own index for the error.
    form.facts[4] = { text: "", source: "https://example.org/5" };
    expect(validate(form)).toEqual([{ field: "fact-4-text", message: MESSAGES.factText }]);
  });

  it("both interactions are ticked at start, and talk and echo are not offered", () => {
    expect(emptyForm().interactions).toEqual(["colours", "lamp"]);
  });

  it("the QR url is origin plus /s/ plus the id", () => {
    expect(qrUrl("https://lampa.example", "decebal-bridge")).toBe("https://lampa.example/s/decebal-bridge");
  });

  it("a 409 already_published on live counts as done", () => {
    const err = new AuthApiError(409, "already_published");
    expect(stepDone("live", err)).toBe(true);
    expect(stepDone("greeting", err)).toBe(false);
    expect(stepDone("live", new AuthApiError(409, "over_cap"))).toBe(false);
  });

  it("each error status maps to its message", () => {
    expect(stepError(new AuthApiError(403, "forbidden"))).toEqual({ text: "This account cannot publish places.", unlock: true });
    expect(stepError(new AuthApiError(409, "site_exists"))).toEqual({
      text: "A place with this page address already exists. Change the English name.",
      unlock: true,
    });
    expect(stepError(new AuthApiError(409, "over_cap"))).toEqual({
      text: "This would use more than 2,000 credits. Nothing was generated.",
      unlock: false,
    });
    expect(stepError(new AuthApiError(502, "generation_failed"))).toEqual({
      text: "The voice service did not answer. Try again; files already made are kept.",
      unlock: false,
    });
    expect(stepError(new AuthApiError(503, "unavailable"))).toEqual({ text: "The server is not ready. Try again in a minute.", unlock: false });
    expect(stepError(new AuthApiError(429, "rate_limited"))).toEqual({ text: "Too many places this hour. Try again later.", unlock: false });
    const failed = { text: "That did not save. Try again.", unlock: false };
    expect(stepError(new AuthApiError(400, "invalid_place"))).toEqual(failed);
    expect(stepError(new ApiError(500))).toEqual(failed);
    expect(stepError(new TypeError("Failed to fetch"))).toEqual(failed);
    expect(stepError(new AuthApiError(401))).toBe("ended");
    expect(stepError({ error: "login_required" })).toBe("ended");
  });
});
