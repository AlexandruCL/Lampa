import { expect, it } from "vitest";
import { newBottles } from "./useBottles";

const b = (echoId: string) => ({ echoId, audioUrl: `/blob/${echoId}` });

it("newBottles keeps the bottles that are not known yet, each once, in order", () => {
  expect(newBottles([b("a"), b("b"), b("a"), b("c")], new Set(["b"])).map((x) => x.echoId)).toEqual(["a", "c"]);
  expect(newBottles([b("a")], new Set(["a"]))).toEqual([]);
});
