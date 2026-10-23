import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normalizeDesignColors, toHexColor } from "./normalize-design-colors.ts";

describe("Bio Design color normalization", () => {
  it("converts rgb/rgba/short hex to the hex form the API accepts", () => {
    assert.equal(toHexColor("rgba(255, 247, 242, 0.90)"), "#FFF7F2E6");
    assert.equal(toHexColor("rgb(8, 15, 28)"), "#080F1C");
    assert.equal(toHexColor("#abc"), "#AABBCC");
    assert.equal(toHexColor("#ffffff33"), "#FFFFFF33");
    assert.equal(toHexColor("red"), null);
  });

  it("walks nested objects and leaves other strings alone", () => {
    assert.deepEqual(
      normalizeDesignColors({ colors: { surface: "rgba(0, 0, 0, 0.5)", text: "#FFF" }, font: "Chillax", list: ["rgb(1,2,3)"] }),
      { colors: { surface: "#00000080", text: "#FFFFFF" }, font: "Chillax", list: ["#010203"] },
    );
  });
});
