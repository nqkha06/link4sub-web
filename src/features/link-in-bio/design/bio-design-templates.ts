import { isBioBuiltinAssetId, type BioDesign, type BioUsernameEffect } from "@/contracts"

import { ADDITIONAL_GUNS_TEMPLATES } from "./bio-design-template-catalog"
import { MORE_GUNS_TEMPLATES } from "./bio-design-template-catalog-2"

/**
 * Template Bio Design dựng sẵn, lấy từ bộ crawl guns.lol
 * (guns-template-crawler/output/templates, cấu hình `dashboard.json > data.config`).
 *
 * Chỉ khai báo các thiết lập trang bio hỗ trợ; phần không hỗ trợ đã bỏ qua:
 * avatar, tiêu đề tab động, monochrome/swap colors, shuffle nhạc, cursor effect,
 * widget Discord và mọi mục `premium` (bộ crawl ghi lại thiết lập premium của
 * tài khoản crawl chứ không phải của template).
 *
 * Asset đi kèm (video nền đã nén lại ≤1080p/30fps, nhạc, con trỏ, ảnh thẻ) nằm ở
 * `public/assets/bio/templates/<id>/` và được tham chiếu bằng id
 * `builtin:templates/<id>/<file>` (xem resolveBioBuiltinAssetUrl trong contracts).
 */

export type GunsTemplate = {
  id: string
  name: string
  /** Tác giả template trên guns.lol. */
  creator: string
  description: string
  /** Video nền (background.mp4) hay chỉ màu nền. */
  background: { video: true } | { image: string } | { color: string }
  backgroundEffect: BioDesign["effects"]["background"]["type"]
  effectColor: string
  textColor: string
  iconColor: string
  accentColor: string
  /** Thẻ hồ sơ: màu nền (bg_color) hoặc gradient, độ mờ 0–1, blur px. */
  card: { color: string; gradient: [string, string] | null; opacity: number; blur: number }
  usernameEffect: BioUsernameEffect
  usernameGlow: boolean
  socialGlow: boolean
  badgeGlow: boolean
  /** Nhạc nền (music.mp3) và tên bài. */
  music: { title: string } | null
  /** Con trỏ tuỳ chỉnh (tên file trong thư mục template). */
  cursor: string | null
  volumeControl: boolean
}

export type BioDesignTemplate = {
  id: string
  name: string
  creator: string
  description: string
  thumbnailUrl: string
  features: Array<"video" | "music" | "cursor">
  /** URL video nền (để tải trước khi áp dụng); không có nếu nền là màu. */
  videoUrl: string | null
  /**
   * Áp template lên design hiện tại: chỉ ghi các thiết lập template khai báo
   * (nền, màu, thẻ, hiệu ứng, glow, nhạc, con trỏ); bố cục, font, kiểu nút,
   * bộ sưu tập… của người dùng giữ nguyên.
   */
  apply: (current: BioDesign) => BioDesign
}

const GUNS_TEMPLATES: GunsTemplate[] = [
  {
    id: "cool-dark", name: "Cool Dark", creator: "cisek", description: "Video nền tối, tuyết rơi, tên lấp lánh trắng.",
    background: { video: true }, backgroundEffect: "snowflakes", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#FFFFFF", gradient: ["#0C0C0C", "#000000"], opacity: 0, blur: 0 },
    usernameEffect: "sparkles-white", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: { title: "asdas" }, cursor: "cursor.png", volumeControl: true,
  },
  {
    id: "best-4k", name: "Best 4K", creator: "cisek", description: "Video 4K tối giản, tuyết rơi, tên lấp lánh.",
    background: { video: true }, backgroundEffect: "snowflakes", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#F8F9FA", gradient: ["#000000", "#000000"], opacity: 0, blur: 0 },
    usernameEffect: "sparkles-white", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: { title: "Bengier kurwy v2" }, cursor: "cursor.png", volumeControl: true,
  },
  {
    id: "your-name", name: "Your Name", creator: "ak213", description: "Video anime, hiệu ứng đêm, thẻ kính mờ.",
    background: { video: true }, backgroundEffect: "night-time", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#305796", gradient: ["#FFFFFF", "#636363"], opacity: 0.03, blur: 10 },
    usernameEffect: "none", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: { title: "ss" }, cursor: "cursor.png", volumeControl: false,
  },
  {
    id: "svart", name: "Svart", creator: "yuez", description: "Nền đen tuyền tối giản, có nhạc.",
    background: { color: "#000000" }, backgroundEffect: "none", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#000000",
    card: { color: "#080808", gradient: null, opacity: 0, blur: 0 },
    usernameEffect: "none", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: { title: "2 girls in the cut" }, cursor: "cursor.png", volumeControl: true,
  },
  {
    id: "city-night", name: "City Night", creator: "fae", description: "Phố đêm, nhiễu TV cũ, có nhạc.",
    background: { video: true }, backgroundEffect: "old-tv", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#000000",
    card: { color: "#000000", gradient: ["#171717", "#000000"], opacity: 0.03, blur: 0 },
    usernameEffect: "sparkles-white", usernameGlow: false, socialGlow: false, badgeGlow: false,
    music: { title: ";3" }, cursor: "cursor.png", volumeControl: true,
  },
  {
    id: "purple-night", name: "Purple Night", creator: "wieex", description: "Video nền, không hiệu ứng, glow trắng.",
    background: { video: true }, backgroundEffect: "none", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#000000",
    card: { color: "#000000", gradient: null, opacity: 0, blur: 0 },
    usernameEffect: "none", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: null, cursor: "cursor.png", volumeControl: false,
  },
  {
    id: "clean-drive", name: "Clean Drive", creator: "komisariat", description: "Video xe, tuyết rơi, tên lấp lánh.",
    background: { video: true }, backgroundEffect: "snowflakes", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#FFFFFF", gradient: ["#0C0C0C", "#000000"], opacity: 0, blur: 0 },
    usernameEffect: "sparkles-white", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: null, cursor: "cursor.png", volumeControl: true,
  },
  {
    id: "old-tv", name: "Old TV", creator: "6dbx", description: "Nền đen với nhiễu TV cũ, có nhạc.",
    background: { color: "#000000" }, backgroundEffect: "old-tv", effectColor: "#FFFFFF",
    textColor: "#FFFFFF", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#000000", gradient: null, opacity: 0, blur: 0 },
    usernameEffect: "none", usernameGlow: false, socialGlow: false, badgeGlow: false,
    music: { title: "BATARD #2" }, cursor: "cursor.cur", volumeControl: false,
  },
  {
    id: "aura", name: "Aura", creator: "haydn", description: "Rừng đêm cực quang, hiệu ứng đêm.",
    background: { video: true }, backgroundEffect: "night-time", effectColor: "#FFFFFF",
    textColor: "#F8F9FA", iconColor: "#FFFFFF", accentColor: "#FFFFFF",
    card: { color: "#F8F9FA", gradient: ["#FFFFFF", "#FFFFFF"], opacity: 0, blur: 0 },
    usernameEffect: "sparkles-white", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: null, cursor: "cursor.png", volumeControl: false,
  },
  {
    id: "toji", name: "Toji", creator: "maitre_sunny", description: "Video anime 4K, mưa, tông nâu đồng.",
    background: { video: true }, backgroundEffect: "rain", effectColor: "#FFFFFF",
    textColor: "#C98C61", iconColor: "#C98C61", accentColor: "#C98C61",
    card: { color: "#C98C61", gradient: null, opacity: 0, blur: 0 },
    usernameEffect: "none", usernameGlow: true, socialGlow: true, badgeGlow: true,
    music: null, cursor: null, volumeControl: true,
  },
  ...ADDITIONAL_GUNS_TEMPLATES,
  ...MORE_GUNS_TEMPLATES,
]

const asset = (template: GunsTemplate, file: string) => `builtin:templates/${template.id}/${file}`

/** Thêm kênh alpha (0–1) vào màu #RRGGBB. */
function withAlpha(color: string, opacity: number) {
  const alpha = Math.round(Math.min(1, Math.max(0, opacity)) * 255).toString(16).padStart(2, "0").toUpperCase()
  return `${color.slice(0, 7)}${alpha}`
}

function applyTemplate(template: GunsTemplate, base: BioDesign): BioDesign {
  const { card } = template
  // Asset của template trước (builtin:...) thì bỏ khi template mới không có; file người dùng tự chọn thì giữ.
  const keepCursor = !isBioBuiltinAssetId(base.effects.cursor.assetId)
  const keepMusic = !isBioBuiltinAssetId(base.audio.music.assetId)
  return {
    ...base,
    profile: {
      ...base.profile,
      card: {
        ...base.profile.card,
        backgroundColor: card.color,
        backgroundOpacity: Math.round(card.opacity * 100),
        backdropBlur: card.blur,
        gradientEnabled: card.gradient !== null,
        gradientFrom: card.gradient ? withAlpha(card.gradient[0], card.opacity) : base.profile.card.gradientFrom,
        gradientTo: card.gradient ? withAlpha(card.gradient[1], card.opacity) : base.profile.card.gradientTo,
      },
    },
    background: "video" in template.background
      ? { ...base.background, type: "video", color: "#0A0A0A", imageAssetId: null, videoAssetId: asset(template, "background.mp4") }
      : "image" in template.background
        ? { ...base.background, type: "image", imageAssetId: asset(template, template.background.image), videoAssetId: null }
        : { ...base.background, type: "color", color: template.background.color, imageAssetId: null, videoAssetId: null },
    appearance: {
      ...base.appearance,
      colors: {
        ...base.appearance.colors,
        accent: template.accentColor,
        text: template.textColor,
        textMuted: withAlpha(template.textColor, 0.5),
        icon: template.iconColor,
        link: withAlpha(template.textColor, 0.65),
      },
      links: { ...base.appearance.links, textColor: template.textColor, iconColor: template.iconColor },
    },
    effects: {
      ...base.effects,
      background: { ...base.effects.background, type: template.backgroundEffect, color: template.effectColor },
      username: { ...base.effects.username, type: template.usernameEffect, glowEnabled: template.usernameGlow, glowColor: template.textColor },
      social: { ...base.effects.social, glowEnabled: template.socialGlow, glowColor: template.iconColor },
      badges: { ...base.effects.badges, glowEnabled: template.badgeGlow, glowColor: template.textColor },
      cursor: template.cursor
        ? { ...base.effects.cursor, type: "custom", assetId: asset(template, template.cursor), hotspotX: 0, hotspotY: 0 }
        : keepCursor ? base.effects.cursor : { ...base.effects.cursor, type: "default", assetId: null },
    },
    audio: {
      ...base.audio,
      music: template.music
        ? { ...base.audio.music, enabled: true, assetId: asset(template, "music.mp3"), title: template.music.title, artist: "", startMode: "on-enter" }
        : keepMusic ? base.audio.music : { ...base.audio.music, enabled: false, assetId: null, title: "" },
      player: { ...base.audio.player, visible: template.volumeControl },
    },
  }
}

export const BIO_DESIGN_TEMPLATES: BioDesignTemplate[] = GUNS_TEMPLATES.map((template) => ({
  id: template.id,
  name: template.name,
  creator: template.creator,
  description: template.description,
  thumbnailUrl: `/assets/bio/templates/${template.id}/thumbnail.webp`,
  features: [
    ...("video" in template.background ? ["video" as const] : []),
    ...(template.music ? ["music" as const] : []),
    ...(template.cursor ? ["cursor" as const] : []),
  ],
  videoUrl: "video" in template.background ? `/assets/bio/templates/${template.id}/background.mp4` : null,
  apply: (current) => applyTemplate(template, current),
}))
