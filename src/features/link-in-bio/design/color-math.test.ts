import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatColor, hexToRgba, hsvaToRgba, parseColor, rgbaToHex, rgbaToHsva } from "./color-math.ts";

describe("color math", () => {
  it("round-trips hex with and without alpha", () => {
    assert.equal(rgbaToHex(hexToRgba("#ff8800")!), "#FF8800");
    assert.equal(rgbaToHex(hexToRgba("#FFFFFF80")!), "#FFFFFF80");
    assert.equal(rgbaToHex(hexToRgba("#abc")!), "#AABBCC");
    assert.equal(rgbaToHex({ r: 255, g: 0, b: 0, a: 0.5 }, false), "#FF0000");
  });

  it("converts through HSV without drifting", () => {
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#C98C61", "#305796", "#000000", "#FFFFFF"]) {
      assert.equal(rgbaToHex(hsvaToRgba(rgbaToHsva(hexToRgba(hex)!))), hex);
    }
  });

  it("formats and parses rgb / hsl", () => {
    const color = hexToRgba("#FF000080")!;
    assert.equal(formatColor(color, "rgb"), "rgba(255, 0, 0, 0.5)");
    assert.equal(formatColor(color, "hsl"), "hsla(0, 100%, 50%, 0.5)");
    assert.equal(rgbaToHex(parseColor("rgb(201, 140, 97)")!), "#C98C61");
    assert.equal(rgbaToHex(parseColor("hsl(120, 100%, 50%)")!), "#00FF00");
    assert.equal(rgbaToHex(parseColor("rgba(0, 0, 0, 0.5)")!), "#00000080");
    assert.equal(parseColor("not a color"), null);
  });
});
