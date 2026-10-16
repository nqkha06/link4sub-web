import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bioBackgroundPresets,
  getBioBackgroundPresetById,
  getBioPresetTheme,
} from "./background-presets.ts";

describe("Link Bio background presets", () => {
  it("registers the complete image background collection", () => {
    const imagePresets = bioBackgroundPresets.filter((preset) => preset.category !== "solid");
    const solidPresets = bioBackgroundPresets.filter((preset) => preset.category === "solid");

    assert.equal(imagePresets.length, 31);
    assert.equal(imagePresets.filter((preset) => preset.category === "vietnam").length, 5);
    assert.equal(new Set(bioBackgroundPresets.map((preset) => preset.id)).size, bioBackgroundPresets.length);
    assert.ok(bioBackgroundPresets.every((preset) => preset.id.startsWith("preset:")));
    assert.ok(imagePresets.every((preset) => preset.imageUrl.endsWith(".jpg")));
    assert.ok(solidPresets.length > 0);
    assert.ok(solidPresets.every((preset) => !preset.imageUrl && /^#[0-9a-f]{6}$/i.test(preset.backgroundColor ?? "")));
  });

  it("registers the generated Vietnam collection with complete themes", () => {
    const vietnamPresets = bioBackgroundPresets.filter((preset) => preset.category === "vietnam");

    assert.deepEqual(
      vietnamPresets.map((preset) => preset.id),
      [
        "preset:vietnam-hoi-an-lanterns",
        "preset:vietnam-ha-long-dawn",
        "preset:vietnam-sapa-terraces",
        "preset:vietnam-radiant-flag",
        "preset:vietnam-golden-drum",
      ],
    );
    assert.ok(vietnamPresets.every((preset) => preset.theme.buttonColor && preset.theme.textColor));
  });

  it("resolves a saved preset id", () => {
    const preset = getBioBackgroundPresetById("preset:cobalt-snowfall");

    assert.equal(preset?.name, "Tuyết xanh cobalt");
    assert.equal(preset?.imageUrl, "/assets/images/bios/25-cobalt-snowfall-9x16.jpg");
    assert.equal(preset?.theme.buttonColor, "#dbeafe");
    assert.ok(preset?.theme.sectionColor);
  });

  it("keeps a legacy custom accent when no preset was saved", () => {
    const theme = getBioPresetTheme(undefined, "/legacy/background.jpg", "#7c3aed");

    assert.equal(theme.accentColor, "#7c3aed");
    assert.equal(theme.buttonColor, "#7c3aed");
  });
});
