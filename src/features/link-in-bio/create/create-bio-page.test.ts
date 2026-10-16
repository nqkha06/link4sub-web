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
  it("lowercases and replaces unsupported characters", () => {
    assert.equal(sanitizeBioSlugInput("Ngô Kha  Shop!", false), "ng-kha-shop-");
    assert.equal(sanitizeBioSlugInput("--abc", false), "abc");
  });

  it("keeps case when aliases are case sensitive", () => {
    assert.equal(sanitizeBioSlugInput("MyPage", true), "MyPage");
  });

  it("caps the length", () => {
    assert.equal(sanitizeBioSlugInput("a".repeat(200), false).length, BIO_SLUG_MAX_LENGTH);
  });
});

describe("buildCreateBioPayload", () => {
  it("creates an empty draft with trimmed basics", () => {
    const payload = buildCreateBioPayload({
      name: "  Kha  ",
      slug: "kha-",
      description: "  ",
      access: "published",
    });

    assert.equal(payload.name, "Kha");
    assert.equal(payload.customSlug, "kha");
    assert.equal(payload.title, undefined);
    assert.equal(payload.status, "draft");
    assert.deepEqual(payload.customLinks, []);
    assert.equal(payload.appearance.buttonStyle, "rounded");
    assert.ok(payload.appearance.selectedBackgroundId);
  });

  it("lets the API generate the slug when empty", () => {
    const payload = buildCreateBioPayload({ name: "Kha", slug: "", description: "Hi", access: "draft" });
    assert.equal(payload.customSlug, undefined);
    assert.equal(payload.title, "Hi");
  });
});

describe("pickRandomBioBackgroundPreset", () => {
  it("maps the random value onto the preset list", () => {
    assert.equal(pickRandomBioBackgroundPreset(() => 0)?.id, bioBackgroundPresets[0].id);
    assert.equal(pickRandomBioBackgroundPreset(() => 0.9999)?.id, bioBackgroundPresets.at(-1)?.id);
  });

  it("is used for the new page background", () => {
    const preset = bioBackgroundPresets[1];
    const payload = buildCreateBioPayload({ name: "Kha", slug: "", description: "", access: "draft" }, () => 1 / bioBackgroundPresets.length + 0.0001);
    assert.equal(payload.appearance.selectedBackgroundId, preset.id);
    assert.equal(payload.appearance.backgroundColor, preset.theme.accentColor);
  });
});

describe("createStarterBioContent", () => {
  it("adds empty social rows and one link, ordered socials first", () => {
    let counter = 0;
    const starter = createStarterBioContent((prefix) => `${prefix}-${++counter}`);
    assert.deepEqual(starter.socialLinks.map((s) => s.platform), [...STARTER_SOCIAL_PLATFORMS]);
    assert.ok(starter.socialLinks.every((s) => s.url === "" && s.enabled));
    assert.equal(starter.customLinks.length, 1);
    assert.deepEqual(starter.contentOrder, [
      { type: "social", id: "socials" },
      { type: "link", id: starter.customLinks[0].id },
    ]);
  });
});
