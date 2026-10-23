import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createRaindrops, stepRaindrops } from "./rain-canvas.ts";

describe("rain effect", () => {
  it("creates drops inside the viewport with the original length and speed ranges", () => {
    const drops = createRaindrops(50, 400, 300);
    assert.equal(drops.length, 50);
    for (const drop of drops) {
      assert.ok(drop.x >= 0 && drop.x <= 400 && drop.y >= 0 && drop.y <= 300);
      assert.ok(drop.length >= 10 && drop.length < 30);
      assert.ok(drop.velocityY >= 2 && drop.velocityY < 7);
    }
  });

  it("moves drops down and recycles them above the top edge", () => {
    const drops = [{ x: 10, y: 298, length: 12, velocityY: 4 }];
    stepRaindrops(drops, 400, 300, 1, 1, () => 0.5);
    assert.deepEqual(drops[0], { x: 200, y: -12, length: 12, velocityY: 4 });
    stepRaindrops(drops, 400, 300, 2, 1.5);
    assert.equal(drops[0].y, 0);
  });
});
