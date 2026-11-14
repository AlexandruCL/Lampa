import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError } from "./client";
import { fetchSite } from "./sites";

const fetchMock = vi.fn();

const detail = {
  id: "new-place",
  name: "Piața Nouă",
  lat: 45.75,
  lng: 21.23,
  is_memorial: false,
  radius_m: 60,
  interactions: ["lamp", "colour"],
  facts: [],
  directions_hint: "",
  glow: 0.4,
};

function answer(status: number, body: unknown) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  // A stored token, so authFetch goes straight to the request.
  vi.stubGlobal("localStorage", { getItem: () => "abc123", setItem: () => {}, removeItem: () => {} });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

describe("fetchSite", () => {
  it("a SiteDetail becomes a PhoneSite with its interactions", async () => {
    answer(200, detail);
    await expect(fetchSite("new-place", "ro")).resolves.toEqual({
      id: "new-place",
      name: "Piața Nouă",
      lat: 45.75,
      lng: 21.23,
      is_memorial: false,
      lamp: true,
      interactions: ["lamp", "colour"],
    });
  });

  it("lamp is true only when interactions list lamp", async () => {
    answer(200, { ...detail, interactions: ["colour", "echo"] });
    expect((await fetchSite("new-place", "en"))?.lamp).toBe(false);
    answer(200, { ...detail, interactions: [] });
    expect((await fetchSite("new-place", "en"))?.lamp).toBe(false);
  });

  it("a bed path becomes a full URL on the API; no bed leaves the key out", async () => {
    answer(200, { ...detail, bed: "/blob/site-new-place_bed-1-abc123abc123.wav" });
    expect((await fetchSite("new-place", "en"))?.bed).toBe(`${API_URL}/blob/site-new-place_bed-1-abc123abc123.wav`);
    answer(200, detail);
    expect(await fetchSite("new-place", "en")).not.toHaveProperty("bed");
  });
  it("a 404 gives null", async () => {
    answer(404, { error: "unknown_site" });
    await expect(fetchSite("nowhere", "en")).resolves.toBeNull();
  });

  it("a 503 throws ApiError 503", async () => {
    answer(503, { error: "unavailable" });
    const error = await fetchSite("new-place", "en").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(503);
  });

  it("a network error throws", async () => {
    const offline = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValue(offline);
    await expect(fetchSite("new-place", "en")).rejects.toBe(offline);
  });

  it("the path encodes the id and carries lang", async () => {
    answer(200, detail);
    await fetchSite("a b/c", "ro");
    expect(fetchMock.mock.calls[0][0]).toBe(`${API_URL}/sites/a%20b%2Fc?lang=ro`);
  });
});
