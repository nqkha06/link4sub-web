import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { basename, extname, join } from "node:path"

import sharp from "sharp"

const [sourceRoot, outputRoot, manifestPath, ffmpegPath, startArg = "1361", endArg = "1410"] = process.argv.slice(2)

if (!sourceRoot || !outputRoot || !manifestPath || !ffmpegPath) {
  throw new Error("Usage: node scripts/import-guns-bio-templates.mjs <source> <output> <manifest> <ffmpeg> [start] [end]")
}

const startNumber = Number(startArg)
const endNumber = Number(endArg)
if (!Number.isInteger(startNumber) || !Number.isInteger(endNumber) || startNumber > endNumber) {
  throw new Error(`Invalid template range: ${startArg}–${endArg}`)
}

const BACKGROUND_EFFECTS = {
  none: "none",
  blurred: "blurred",
  night: "night-time",
  rain: "rain",
  snowflakes: "snowflakes",
  tv: "old-tv",
}

const USERNAME_EFFECTS = {
  black: "sparkles-black",
  blue: "sparkles-blue",
  green: "sparkles-green",
  pink: "sparkles-pink",
  red: "sparkles-red",
  white: "sparkles-white",
  yellow: "sparkles-yellow",
  rgb: "rainbow",
  none: "none",
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36)
    .replace(/-+$/g, "") || "template"
}

function color(value, fallback = "#FFFFFF") {
  const normalized = String(value || "").trim().toUpperCase()
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"))
}

function mediaByRole(media, role) {
  return media.files?.find((file) => file.role === role && file.status === "ok") ?? null
}

function musicTitle(config, fallback) {
  if (Array.isArray(config.audio)) {
    const selected = config.audio.find((item) => item?.selected) ?? config.audio[0]
    return String(selected?.title || fallback).trim()
  }
  return fallback
}

function descriptionFor(backgroundKind, effect, hasMusic, hasCursor) {
  const parts = [backgroundKind === "video" ? "Video nền" : backgroundKind === "image" ? "Ảnh nền" : "Nền màu"]
  const effectLabels = {
    blurred: "hiệu ứng mờ",
    "night-time": "hiệu ứng đêm",
    rain: "hiệu ứng mưa",
    snowflakes: "tuyết rơi",
    "old-tv": "nhiễu TV cũ",
  }
  if (effectLabels[effect]) parts.push(effectLabels[effect])
  if (hasMusic) parts.push("có nhạc")
  if (hasCursor) parts.push("cursor riêng")
  return `${parts.join(", ")}.`
}

const templates = []
const usedIds = new Set()
const existingIds = new Set(
  existsSync(outputRoot)
    ? readdirSync(outputRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [],
)

for (let number = startNumber; number <= endNumber; number += 1) {
  const source = join(sourceRoot, `template_${String(number).padStart(6, "0")}`)
  const dashboardFile = join(source, "dashboard.json")
  const metadataFile = join(source, "metadata.json")
  const mediaFile = join(source, "media.json")
  if (![dashboardFile, metadataFile, mediaFile].every(existsSync)) continue

  const config = readJson(dashboardFile)?.data?.config
  const metadata = readJson(metadataFile)
  const media = readJson(mediaFile)
  if (!config || !metadata?.name || media?.summary?.complete !== true) continue

  const baseId = slugify(metadata.name)
  let id = existingIds.has(baseId) ? `${baseId.slice(0, 28)}-${number}` : baseId
  let suffix = 2
  while (usedIds.has(id)) id = `${baseId.slice(0, 33)}-${suffix++}`
  usedIds.add(id)

  const output = join(outputRoot, id)
  mkdirSync(output, { recursive: true })

  const thumbnail = mediaByRole(media, "thumbnail")
  if (!thumbnail) continue
  await sharp(join(source, thumbnail.localPath), { animated: false, page: 0 })
    .resize(640, 360, { fit: "cover", position: "centre" })
    .webp({ quality: 78 })
    .toFile(join(output, "thumbnail.webp"))

  const backgroundMedia = mediaByRole(media, "background")
  let background = { kind: "color", color: color(config.color, "#0A0A0A") }
  if (backgroundMedia) {
    const sourceFile = join(source, backgroundMedia.localPath)
    const sourceExtension = extname(backgroundMedia.localPath).toLowerCase()
    if (backgroundMedia.contentType?.startsWith("video/") || sourceExtension === ".mov" || sourceExtension === ".mp4") {
      execFileSync(ffmpegPath, [
        "-hide_banner", "-loglevel", "error", "-y", "-i", sourceFile,
        "-an", "-vf", "scale='min(1920,iw)':-2:force_original_aspect_ratio=decrease,fps=30",
        "-c:v", "libx264", "-preset", "medium", "-crf", "32",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(output, "background.mp4"),
      ], { stdio: "inherit" })
      background = { kind: "video", file: "background.mp4" }
    } else if (sourceExtension === ".gif") {
      cpSync(sourceFile, join(output, "background.gif"))
      background = { kind: "image", file: "background.gif" }
    } else {
      await sharp(sourceFile).webp({ quality: 82 }).toFile(join(output, "background.webp"))
      background = { kind: "image", file: "background.webp" }
    }
  }

  const audioMedia = mediaByRole(media, "audio")
  if (audioMedia) cpSync(join(source, audioMedia.localPath), join(output, "music.mp3"))

  const cursorMedia = mediaByRole(media, "cursor")
  let cursor = null
  if (cursorMedia) {
    const extension = extname(cursorMedia.localPath).toLowerCase() || ".png"
    cursor = `cursor${extension}`
    cpSync(join(source, cursorMedia.localPath), join(output, cursor))
  }

  const backgroundEffect = BACKGROUND_EFFECTS[config.background_effects] ?? "none"
  const usernameEffect = USERNAME_EFFECTS[config.username_effects || "none"] ?? "none"
  const name = String(metadata.name).trim()
  templates.push({
    sourceId: basename(source),
    id,
    name,
    creator: String(metadata.creator || "unknown").trim(),
    description: descriptionFor(background.kind, backgroundEffect, Boolean(audioMedia), Boolean(cursor)),
    background,
    backgroundEffect,
    effectColor: color(config.background_effects_color),
    textColor: color(config.text_color),
    iconColor: color(config.icon_color),
    accentColor: color(config.bg_color, color(config.color)),
    card: {
      color: color(config.bg_color, color(config.color)),
      gradient: config.profile_gradient ? [color(config.gradient_1), color(config.gradient_2)] : null,
      opacity: Math.min(1, Math.max(0, Number(config.opacity) || 0)),
      blur: Math.min(40, Math.max(0, Number(config.blur) || 0)),
    },
    usernameEffect,
    usernameGlow: Boolean(config.username_glow),
    socialGlow: Boolean(config.social_glow),
    badgeGlow: Boolean(config.badge_glow),
    music: audioMedia ? { title: musicTitle(config, name) } : null,
    cursor,
    volumeControl: Boolean(config.volume_control),
  })
  process.stdout.write(`Imported ${number}: ${id}\n`)
}

writeFileSync(manifestPath, `${JSON.stringify(templates, null, 2)}\n`)
process.stdout.write(`Wrote ${templates.length} templates to ${manifestPath}\n`)
