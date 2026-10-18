import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getLinkAnimationClassName,
  getLinkAnimationPreviewClassName,
  getLinkAnimationStyle,
  linkAnimationPresets,
  normalizeLinkAnimationEffect,
} from "./link-animation.ts";

describe("Link Bio link animations", () => {
  it("keeps every selectable preset wired to its renderer", () => {
    assert.equal(
      new Set(linkAnimationPresets.map(({ effect }) => effect)).size,
      linkAnimationPresets.length,
    );
    for (const { effect, group } of linkAnimationPresets) {
      const className = getLinkAnimationClassName(effect);
      const previewClassName = getLinkAnimationPreviewClassName(effect);
      assert.equal(normalizeLinkAnimationEffect(effect), effect);
      assert.equal(effect === "none", className === "");
      if (group === "aura") assert.equal(previewClassName, className);
    }
  });

  it("treats missing and legacy values as no animation", () => {
    assert.equal(normalizeLinkAnimationEffect(undefined), "none");
    assert.equal(normalizeLinkAnimationEffect("legacy-effect"), "none");
    assert.equal(getLinkAnimationClassName(undefined), "");
  });

  it("uses a deterministic non-negative stagger based on content order", () => {
    const style = getLinkAnimationStyle(3) as Record<string, string>;
    assert.equal(style["--link-animation-delay"], "540ms");
    assert.match(getLinkAnimationPreviewClassName("glow"), /link-bio-animation--live-preview/);
    const previewStyle = getLinkAnimationStyle(3, 90) as Record<string, string>;
    assert.equal(previewStyle["--link-animation-delay"], "270ms");
    assert.equal(
      (getLinkAnimationStyle(-2) as Record<string, string>)["--link-animation-delay"],
      "0ms",
    );
  });
});
