import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import test from "node:test"

import { LINK_BACKGROUND_IMAGE_PRESETS } from "./background-image-presets.ts"

test("the background library contains 24 complete local wallpaper pairs", () => {
  assert.equal(LINK_BACKGROUND_IMAGE_PRESETS.length, 24)
  assert.equal(new Set(LINK_BACKGROUND_IMAGE_PRESETS.map((preset) => preset.id)).size, 24)

  for (const preset of LINK_BACKGROUND_IMAGE_PRESETS) {
    assert.match(preset.imageUrl, /^\/assets\/images\/stus\/.+-mobile\.png$/)
    assert.match(preset.desktopImageUrl, /^\/assets\/images\/stus\/.+-desktop\.png$/)
    assert.equal(
      preset.imageUrl.replace(/-mobile\.png$/, ""),
      preset.desktopImageUrl.replace(/-desktop\.png$/, ""),
    )

    for (const url of [preset.imageUrl, preset.desktopImageUrl]) {
      assert.equal(
        existsSync(join(process.cwd(), "public", url.replace(/^\//, ""))),
        true,
        `Missing wallpaper asset: ${url}`,
      )
    }
  }
})
