import { describe, expect, it } from "vitest";
import { appleMapsUrl, googleMapsUrl, isIPhone } from "./maps";

const site = { lat: 45.7537, lng: 21.2257 };

describe("maps", () => {
  it("the Google link asks for walking directions to lat,lng", () => {
    expect(googleMapsUrl(site)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=45.7537,21.2257&travelmode=walking",
    );
  });

  it("the Apple link asks for walking directions to lat,lng", () => {
    expect(appleMapsUrl(site)).toBe("https://maps.apple.com/?daddr=45.7537,21.2257&dirflg=w");
  });

  it("an iPhone user agent is an iPhone and an Android one is not", () => {
    const iphone =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
    const android =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36";
    expect(isIPhone(iphone)).toBe(true);
    expect(isIPhone(android)).toBe(false);
  });
});
