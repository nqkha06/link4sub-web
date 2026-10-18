import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, it } from "node:test";

import sharp from "sharp";

import {
  LOCAL_SITE_ICON_FILES,
  localSiteIconVersion,
  renderLocalSiteIcons,
} from "./local-site-icon-pipeline.ts";

async function sourceImage() {
  return sharp({
    create: {
      width: 320,
      height: 180,
      channels: 4,
      background: { r: 22, g: 101, b: 216, alpha: 1 },
    },
  })
    .png()
    .toBuffer();
}

describe("local Next.js site icon pipeline", () => {
  it("creates favicon, Apple and PWA files without object storage", async () => {
    const icons = await renderLocalSiteIcons(await sourceImage());
    assert.deepEqual(
      icons.map(({ name }) => name),
      Object.values(LOCAL_SITE_ICON_FILES),
    );

    const favicon = icons.find(
      ({ name }) => name === LOCAL_SITE_ICON_FILES.faviconIco,
    );
    assert.ok(favicon);
    assert.equal(favicon.contentType, "image/x-icon");
    assert.equal(favicon.body.readUInt16LE(0), 0);
    assert.equal(favicon.body.readUInt16LE(2), 1);
    assert.equal(favicon.body.readUInt16LE(4), 2);

    for (const [name, size] of [
      [LOCAL_SITE_ICON_FILES.favicon32, 32],
      [LOCAL_SITE_ICON_FILES.favicon48, 48],
      [LOCAL_SITE_ICON_FILES.appleTouchIcon, 180],
      [LOCAL_SITE_ICON_FILES.icon192, 192],
      [LOCAL_SITE_ICON_FILES.icon512, 512],
    ] as const) {
      const icon = icons.find((candidate) => candidate.name === name);
      assert.ok(icon);
      const metadata = await sharp(icon.body).metadata();
      assert.equal(metadata.width, size);
      assert.equal(metadata.height, size);
    }
  });

  it("uses a stable content version and rejects invalid image bytes", async () => {
    const source = await sourceImage();
    assert.equal(localSiteIconVersion(source), localSiteIconVersion(source));
    assert.notEqual(
      localSiteIconVersion(source),
      localSiteIconVersion(Buffer.concat([source, Buffer.from([0])])),
    );
    await assert.rejects(() => renderLocalSiteIcons(Buffer.from("not-an-image")));
  });

  it("keeps the committed default favicon set in sync with the default logo", async () => {
    const brandDirectory = resolve(process.cwd(), "public/brand");
    const source = await readFile(resolve(brandDirectory, "stu-logo.png"));
    const rendered = await renderLocalSiteIcons(source);

    for (const icon of rendered) {
      assert.deepEqual(
        await readFile(resolve(brandDirectory, icon.name)),
        icon.body,
      );
    }
  });
});
