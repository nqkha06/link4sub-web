import { createHash } from "node:crypto";

import sharp from "sharp";

export const LOCAL_SITE_ICON_FILES = {
  faviconIco: "favicon.ico",
  favicon32: "favicon-32.png",
  favicon48: "favicon-48.png",
  appleTouchIcon: "apple-touch-icon.png",
  icon192: "icon-192.png",
  icon512: "icon-512.png",
} as const;

export type LocalSiteIconFile =
  (typeof LOCAL_SITE_ICON_FILES)[keyof typeof LOCAL_SITE_ICON_FILES];

export type RenderedLocalSiteIcon = {
  name: LocalSiteIconFile;
  contentType: "image/png" | "image/x-icon";
  body: Buffer;
};

const PIPELINE_VERSION = "v1";
const MAX_INPUT_PIXELS = 4096 * 4096;
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

export function localSiteIconVersion(source: Buffer) {
  return createHash("sha256")
    .update(PIPELINE_VERSION)
    .update(source)
    .digest("hex")
    .slice(0, 16);
}

async function renderSquarePng(
  source: Buffer,
  options: { size: number; padding: number; background?: string },
) {
  const inner = Math.max(1, Math.round(options.size * (1 - options.padding * 2)));
  const before = Math.floor((options.size - inner) / 2);
  const after = options.size - inner - before;
  const fill = options.background ?? TRANSPARENT;
  let image = sharp(source, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  }).rotate();
  if (options.background) image = image.flatten({ background: options.background });
  return image
    .resize(inner, inner, { fit: "contain", background: fill })
    .extend({
      top: before,
      bottom: after,
      left: before,
      right: after,
      background: fill,
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** ICO hiện đại chứa PNG 32/48 px, không cần encoder ICO native. */
export function buildLocalIco(images: Array<{ size: number; png: Buffer }>) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries: Buffer[] = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

export async function renderLocalSiteIcons(
  source: Buffer,
): Promise<RenderedLocalSiteIcon[]> {
  const metadata = await sharp(source, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_PIXELS,
  }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Ảnh favicon không có kích thước hợp lệ.");
  }

  const [favicon32, favicon48, appleTouchIcon, icon192, icon512] =
    await Promise.all([
      renderSquarePng(source, { size: 32, padding: 0 }),
      renderSquarePng(source, { size: 48, padding: 0 }),
      renderSquarePng(source, {
        size: 180,
        padding: 0.1,
        background: "#ffffff",
      }),
      renderSquarePng(source, { size: 192, padding: 0.05 }),
      renderSquarePng(source, { size: 512, padding: 0.05 }),
    ]);

  return [
    {
      name: LOCAL_SITE_ICON_FILES.faviconIco,
      contentType: "image/x-icon",
      body: buildLocalIco([
        { size: 32, png: favicon32 },
        { size: 48, png: favicon48 },
      ]),
    },
    {
      name: LOCAL_SITE_ICON_FILES.favicon32,
      contentType: "image/png",
      body: favicon32,
    },
    {
      name: LOCAL_SITE_ICON_FILES.favicon48,
      contentType: "image/png",
      body: favicon48,
    },
    {
      name: LOCAL_SITE_ICON_FILES.appleTouchIcon,
      contentType: "image/png",
      body: appleTouchIcon,
    },
    {
      name: LOCAL_SITE_ICON_FILES.icon192,
      contentType: "image/png",
      body: icon192,
    },
    {
      name: LOCAL_SITE_ICON_FILES.icon512,
      contentType: "image/png",
      body: icon512,
    },
  ];
}
