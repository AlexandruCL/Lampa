import { expect, it } from "vitest";
import { PATHS } from "./paths";

it("holds exactly the five plan paths", () => {
  expect(Object.values(PATHS)).toEqual(["/", "/s/:siteId", "/screen", "/pulse", "/curate"]);
});
