import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BIO_SLUG_MAX_LENGTH,
  buildCreateBioPayload,
  createStarterBioContent,
  pickRandomBioBackgroundPreset,
  sanitizeBioSlugInput,
  STARTER_SOCIAL_PLATFORMS,
} from "./create-bio-page.ts";
import { bioBackgroundPresets } from "../backgrounds/background-presets.ts";

describe("sanitizeBioSlugInput", () => {
  it("applies alias casing, character and length rules", () => {
    const cases = [
      ["Ngô Kha  Shop!", false, "ng-kha-shop-"],
      ["--abc", false, "abc"],
      ["MyPage", true, "MyPage"],
      ["a".repeat(200), false, "a".repeat(BIO_SLUG_MAX_LENGTH)],
    ] as const;
    for (const [input, caseSensitive, expected] of cases) {
      assert.equal(sanitizeBioSlugInput(input, caseSensitive), expected);
    }
  });
});

describe("buildCreateBioPayload", () => {
  it("creates a deterministic empty draft with normalized basics", () => {
    const selectedPreset = bioBackgroundPresets[1];
    const payload = buildCreateBioPayload({
      name: "  Kha  ",
      slug: "kha-",
      description: "  ",
      access: "published",
    }, () => 1 / bioBackgroundPresets.length + 0.0001);

    assert.equal(payload.name, "Kha");
    assert.equal(payload.customSlug, "kha");
    assert.equal(payload.title, undefined);
    assert.equal(payload.status, "draft");
    assert.deepEqual(payload.customLinks, []);
    assert.equal(payload.appearance.buttonStyle, "rounded");
    assert.equal(payload.appearance.selectedBackgroundId, selectedPreset.id);
    assert.equal(payload.appearance.backgroundColor, selectedPreset.theme.accentColor);
  });

  it("lets the API generate the slug when empty", () => {
    const payload = buildCreateBioPayload(
      { name: "Kha", slug: "", description: "Hi", access: "draft" },
      () => 0,
    );
    assert.equal(payload.customSlug, undefined);
    assert.equal(payload.title, "Hi");
  });
});

describe("pickRandomBioBackgroundPreset", () => {
  it("maps the random value onto the preset list", () => {
    assert.equal(pickRandomBioBackgroundPreset(() => 0)?.id, bioBackgroundPresets[0].id);
    assert.equal(pickRandomBioBackgroundPreset(() => 0.9999)?.id, bioBackgroundPresets.at(-1)?.id);
  });

});

describe("createStarterBioContent", () => {
  it("adds empty social rows and one link, ordered socials first", () => {
    let counter = 0;
    const starter = createStarterBioContent((prefix) => `${prefix}-${++counter}`);
    assert.deepEqual(starter.socialLinks.map((s) => s.platform), [...STARTER_SOCIAL_PLATFORMS]);
    assert.ok(starter.socialLinks.every((s) => s.url.startsWith("https://") && s.enabled));
    assert.equal(starter.socialLinks.find((s) => s.platform === "TikTok")?.url, "https://tiktok.com/@");
    assert.equal(starter.customLinks.length, 1);
    assert.deepEqual(starter.contentOrder, [
      { type: "social", id: "socials" },
      { type: "link", id: starter.customLinks[0].id },
    ]);
  });
});
