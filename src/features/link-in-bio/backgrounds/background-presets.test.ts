import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import {
  bioBackgroundPresets,
  getBioBackgroundPresetById,
  getBioPresetTheme,
} from "./background-presets.ts";

describe("Link Bio background presets", () => {
  it("keeps the preset catalogue internally consistent and deployable", () => {
    const imagePresets = bioBackgroundPresets.filter((preset) => preset.category !== "solid");
    const solidPresets = bioBackgroundPresets.filter((preset) => preset.category === "solid");

    assert.ok(imagePresets.length > 0);
    assert.ok(solidPresets.length > 0);
    assert.equal(new Set(bioBackgroundPresets.map((preset) => preset.id)).size, bioBackgroundPresets.length);
    assert.ok(bioBackgroundPresets.every((preset) => preset.id.startsWith("preset:")));
    assert.ok(solidPresets.every((preset) => !preset.imageUrl && /^#[0-9a-f]{6}$/i.test(preset.backgroundColor ?? "")));
    assert.ok(bioBackgroundPresets.every((preset) =>
      preset.theme.buttonColor &&
      preset.theme.buttonTextColor &&
      preset.theme.textColor &&
      preset.theme.sectionColor
    ));
    for (const preset of imagePresets) {
      assert.equal(
        existsSync(join(process.cwd(), "public", preset.imageUrl.replace(/^\//, ""))),
        true,
        `Missing bio background asset: ${preset.imageUrl}`,
      );
    }
  });

  it("resolves a saved preset id", () => {
    const expected = bioBackgroundPresets[Math.floor(bioBackgroundPresets.length / 2)];
    const preset = getBioBackgroundPresetById(expected.id);

    assert.equal(preset, expected);
    assert.equal(getBioBackgroundPresetById("preset:missing"), undefined);
  });

  it("keeps a legacy custom accent when no preset was saved", () => {
    const theme = getBioPresetTheme(undefined, "/legacy/background.jpg", "#7c3aed");

    assert.equal(theme.accentColor, "#7c3aed");
    assert.equal(theme.buttonColor, "#7c3aed");
  });
});
