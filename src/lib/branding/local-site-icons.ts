import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";

import { getServerConfig } from "@/config/server";

import {
  LOCAL_SITE_ICON_FILES,
  localSiteIconVersion,
  renderLocalSiteIcons,
  type LocalSiteIconFile,
} from "./local-site-icon-pipeline";

const METADATA_FILE = "metadata.json";
const VERSION_PATTERN = /^[0-9a-f]{16}$/;
const FILE_SET = new Set<string>(Object.values(LOCAL_SITE_ICON_FILES));

export type LocalSiteIconInfo = {
  version: string;
  updatedAt: string;
};

export class InvalidLocalSiteIconError extends Error {
  constructor(cause: unknown) {
    super("Ảnh favicon không hợp lệ.", { cause });
    this.name = "InvalidLocalSiteIconError";
  }
}

function iconPath(file: LocalSiteIconFile | typeof METADATA_FILE) {
  return join(siteIconDirectory(), file);
}

function siteIconDirectory() {
  const configured = getServerConfig().siteIconDir;
  return isAbsolute(configured)
    ? resolve(/* turbopackIgnore: true */ configured)
    : resolve(/* turbopackIgnore: true */ process.cwd(), configured);
}

export function isLocalSiteIconFile(value: string): value is LocalSiteIconFile {
  return FILE_SET.has(value);
}

export function localSiteIconUrl(file: LocalSiteIconFile, version: string) {
  const base =
    file === LOCAL_SITE_ICON_FILES.faviconIco
      ? "/favicon.ico"
      : file === LOCAL_SITE_ICON_FILES.appleTouchIcon
        ? "/apple-touch-icon.png"
        : `/site-icons/${file}`;
  return `${base}?v=${encodeURIComponent(version)}`;
}

export async function getLocalSiteIconInfo(): Promise<LocalSiteIconInfo | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(iconPath(METADATA_FILE), "utf8"));
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("version" in parsed) ||
      !("updatedAt" in parsed) ||
      typeof parsed.version !== "string" ||
      !VERSION_PATTERN.test(parsed.version) ||
      typeof parsed.updatedAt !== "string"
    ) {
      return null;
    }
    await readFile(iconPath(LOCAL_SITE_ICON_FILES.faviconIco));
    return { version: parsed.version, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}

export async function saveLocalSiteIcons(source: Buffer) {
  let icons: Awaited<ReturnType<typeof renderLocalSiteIcons>>;
  try {
    icons = await renderLocalSiteIcons(source);
  } catch (error) {
    throw new InvalidLocalSiteIconError(error);
  }
  const info: LocalSiteIconInfo = {
    version: localSiteIconVersion(source),
    updatedAt: new Date().toISOString(),
  };
  const directory = siteIconDirectory();
  await mkdir(directory, { recursive: true });

  const suffix = `${process.pid}-${randomUUID()}`;
  const pending = [
    ...icons.map((icon) => ({
      finalPath: iconPath(icon.name),
      temporaryPath: join(directory, `.${icon.name}.${suffix}.tmp`),
      body: icon.body,
    })),
    {
      finalPath: iconPath(METADATA_FILE),
      temporaryPath: join(directory, `.${METADATA_FILE}.${suffix}.tmp`),
      body: Buffer.from(JSON.stringify(info)),
    },
  ];

  try {
    await Promise.all(
      pending.map((file) =>
        writeFile(file.temporaryPath, file.body, { flag: "wx", mode: 0o644 }),
      ),
    );
    // Metadata được đổi tên cuối cùng: reader chỉ thấy version mới sau khi toàn
    // bộ icon của version đó đã sẵn sàng.
    for (const file of pending) await rename(file.temporaryPath, file.finalPath);
  } catch (error) {
    await Promise.all(
      pending.map((file) => unlink(file.temporaryPath).catch(() => undefined)),
    );
    throw error;
  }

  return info;
}

export async function removeLocalSiteIcons() {
  const files: Array<LocalSiteIconFile | typeof METADATA_FILE> = [
    ...Object.values(LOCAL_SITE_ICON_FILES),
    METADATA_FILE,
  ];
  await Promise.all(
    files.map((file) =>
      unlink(iconPath(file)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      }),
    ),
  );
}

export async function localSiteIconResponse(file: LocalSiteIconFile, request: Request) {
  try {
    const [body, info] = await Promise.all([
      readFile(iconPath(file)),
      getLocalSiteIconInfo(),
    ]);
    const etag = `"${info?.version ?? createHash("sha256").update(body).digest("hex").slice(0, 16)}"`;
    if (request.headers.get("if-none-match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag } });
    }
    return new Response(body, {
      headers: {
        "Cache-Control": "public, max-age=300, must-revalidate",
        "Content-Type": file.endsWith(".ico") ? "image/x-icon" : "image/png",
        ETag: etag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
}
