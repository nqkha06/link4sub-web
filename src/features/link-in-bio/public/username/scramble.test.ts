import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scrambleFrame, shuffledOrder, typewriterText } from "./scramble.ts";

describe("username text effects", () => {
  it("decodes left to right and keeps spaces", () => {
    const fixed = () => 0;
    assert.equal(scrambleFrame("ab c", 0, "sweep", [], fixed), "AA A");
    assert.equal(scrambleFrame("ab c", 0.5, "sweep", [], fixed), "ab A");
    assert.equal(scrambleFrame("ab c", 1, "sweep", [], fixed), "ab c");
  });

  it("settles characters in the given random order", () => {
    assert.equal(scrambleFrame("abc", 1 / 3, "random", [2, 0, 1], () => 0), "AbA");
  });

  it("produces a permutation", () => {
    assert.deepEqual([...shuffledOrder(5)].sort(), [0, 1, 2, 3, 4]);
  });

  it("types then deletes", () => {
    assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map((step) => typewriterText("abc", step)), ["", "a", "ab", "abc", "ab", "a", ""]);
  });
});
