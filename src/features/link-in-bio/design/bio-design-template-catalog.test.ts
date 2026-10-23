import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, it } from "node:test"

import { ADDITIONAL_GUNS_TEMPLATES } from "./bio-design-template-catalog.ts"
import { MORE_GUNS_TEMPLATES } from "./bio-design-template-catalog-2.ts"

describe("additional Guns bio templates", () => {
  it("keeps every successful crawl unique and ships each referenced asset", () => {
    const templates = [...ADDITIONAL_GUNS_TEMPLATES, ...MORE_GUNS_TEMPLATES]

    assert.equal(ADDITIONAL_GUNS_TEMPLATES.length, 49)
    assert.equal(MORE_GUNS_TEMPLATES.length, 50)
    assert.equal(new Set(templates.map((template) => template.id)).size, 99)

    for (const template of templates) {
      const root = join(process.cwd(), "public", "assets", "bio", "templates", template.id)
      assert.ok(existsSync(join(root, "thumbnail.webp")), `${template.id} is missing its thumbnail`)

      if ("video" in template.background) {
        assert.ok(existsSync(join(root, "background.mp4")), `${template.id} is missing its video`)
      } else if ("image" in template.background) {
        const image = template.background.image
        assert.ok(image && existsSync(join(root, image)), `${template.id} is missing its image`)
      }
      if (template.music) assert.ok(existsSync(join(root, "music.mp3")), `${template.id} is missing its music`)
      if (template.cursor) assert.ok(existsSync(join(root, template.cursor)), `${template.id} is missing its cursor`)
    }
  })
})
