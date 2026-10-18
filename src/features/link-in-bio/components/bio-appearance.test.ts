import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeBioButtonStyle,
} from "./bio-appearance.ts";

describe("Link Bio button appearance", () => {
  it("preserves current styles and migrates legacy values", () => {
    const cases = [
      ["rounded", "rounded"],
      ["rounded-border", "rounded-border"],
      ["mineral-square", "mineral-square"],
      ["neon-outline", "rounded-border"],
      ["compact-sharp", "mineral-square"],
      ["legacy", "rounded"],
    ] as const;

    for (const [input, expected] of cases) {
      assert.equal(normalizeBioButtonStyle(input), expected, input);
    }
  });
});
