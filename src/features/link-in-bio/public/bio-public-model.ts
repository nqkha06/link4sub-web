/**
 * Hàm thuần cho trang bio công khai (phong cách "glass card").
 * Không import runtime qua alias `@/` để chạy được bằng `node --test`.
 */

import { DEFAULT_BIO_DESIGN, getBioMusicTracks, resolveBioBuiltinAssetUrl, type BioDesign } from "../../../contracts/bio-design.ts";
import type { BioPageDto, BioSocialLinkDto, BioWidgetDto } from "@/lib/api-client";

export type BioDesignAssets = NonNullable<BioPageDto["designAssets"]>;

/**
 * API cũ (chưa có cột design) không trả `design` — luôn rơi về mặc định để
 * trang công khai không vỡ.
 */
export function resolveBioDesign(page: Pick<BioPageDto, "design" | "hasDesign" | "designAssets">): {
  design: BioDesign;
  hasDesign: boolean;
  assets: BioDesignAssets;
} {
  const valid = Boolean(page.design && typeof page.design === "object" && page.design.profile);
  return {
    design: valid ? page.design : DEFAULT_BIO_DESIGN,
    hasDesign: valid && page.hasDesign === true,
    assets: page.designAssets ?? {},
  };
}

/** `color-mix` để áp độ mờ (0–100) lên một màu hex bất kỳ (kể cả #RRGGBBAA). */
export function withOpacity(color: string, opacity: number) {
  const value = Math.min(100, Math.max(0, opacity));
  return value >= 100 ? color : `color-mix(in srgb, ${color} ${value}%, transparent)`;
}

/* -------------------------------------------------------------------------- */
/* Huy hiệu                                                                   */
/* -------------------------------------------------------------------------- */

export type BioProfileBadge = "streamer" | "creator" | "music" | "community";

const BADGE_ORDER: BioProfileBadge[] = ["streamer", "creator", "music", "community"];
const SOCIAL_BADGES: Record<string, BioProfileBadge> = {
  twitch: "streamer",
  youtube: "creator",
  tiktok: "creator",
  spotify: "music",
  "apple music": "music",
  discord: "community",
};
const WIDGET_BADGES: Record<string, BioProfileBadge> = {
  "twitch-stream": "streamer",
  "youtube-video": "creator",
  "tiktok-video": "creator",
  "spotify-track": "music",
  "audio-preview": "music",
};

/** Huy hiệu suy ra từ nền tảng thật trên trang (đang bật, có URL). */
export function getProfileBadges(
  socials: Pick<BioSocialLinkDto, "platform" | "url" | "enabled">[],
  widgets: Pick<BioWidgetDto, "type" | "url" | "enabled">[],
): BioProfileBadge[] {
  const found = new Set<BioProfileBadge>();
  for (const social of socials) {
    if (social.enabled === false || !social.url.trim()) continue;
    const badge = SOCIAL_BADGES[social.platform.trim().toLowerCase()];
    if (badge) found.add(badge);
  }
  for (const widget of widgets) {
    if (widget.enabled === false || !widget.url.trim()) continue;
    const badge = WIDGET_BADGES[widget.type];
    if (badge) found.add(badge);
  }
  return BADGE_ORDER.filter((badge) => found.has(badge));
}

/* -------------------------------------------------------------------------- */
/* Discord                                                                    */
/* -------------------------------------------------------------------------- */

export type DiscordTarget =
  | { kind: "user"; id: string; url: string }
  | { kind: "invite"; code: string; url: string };

export function parseDiscordTarget(value?: string | null): DiscordTarget | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const parts = url.pathname.split("/").filter(Boolean);
    if (host === "discord.gg" && parts[0]) return { kind: "invite", code: parts[0], url: url.toString() };
    if (host === "discord.com" || host === "discordapp.com") {
      if (parts[0] === "users" && /^\d{17,20}$/.test(parts[1] || "")) {
        return { kind: "user", id: parts[1], url: url.toString() };
      }
      if (parts[0] === "invite" && parts[1]) return { kind: "invite", code: parts[1], url: url.toString() };
    }
    return null;
  } catch {
    return null;
  }
}

export type DiscordInvite = {
  code: string;
  name: string;
  iconUrl: string | null;
  members: number | null;
  online: number | null;
};

/** Chuẩn hoá `GET https://discord.com/api/v10/invites/:code?with_counts=true`. */
export function parseDiscordInvite(code: string, raw: unknown): DiscordInvite | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as {
    guild?: { id?: string; name?: string; icon?: string | null };
    approximate_member_count?: number;
    approximate_presence_count?: number;
  };
  if (!data.guild?.id || !data.guild.name) return null;
  return {
    code,
    name: data.guild.name,
    iconUrl: data.guild.icon ? `https://cdn.discordapp.com/icons/${data.guild.id}/${data.guild.icon}.png?size=128` : null,
    members: typeof data.approximate_member_count === "number" ? data.approximate_member_count : null,
    online: typeof data.approximate_presence_count === "number" ? data.approximate_presence_count : null,
  };
}

export type DiscordStatus = "online" | "idle" | "dnd" | "offline";

export type DiscordPresence = {
  userId: string;
  status: DiscordStatus;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  activity: string | null;
  spotify: { song: string; artist: string; albumArtUrl: string | null; trackId: string | null } | null;
};

const STATUSES: DiscordStatus[] = ["online", "idle", "dnd", "offline"];

/** Chuẩn hoá `data` của `GET https://api.lanyard.rest/v1/users/:id`. */
export function parseLanyardPresence(raw: unknown): DiscordPresence | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as {
    discord_status?: string;
    discord_user?: { id?: string; username?: string; global_name?: string | null; avatar?: string | null };
    activities?: { type?: number; name?: string; state?: string | null }[];
    listening_to_spotify?: boolean;
    spotify?: { song?: string; artist?: string; album_art_url?: string | null; track_id?: string | null } | null;
  };
  const user = data.discord_user;
  if (!user?.id || !user.username) return null;
  const activities = Array.isArray(data.activities) ? data.activities : [];
  const custom = activities.find((item) => item.type === 4 && item.state?.trim());
  const playing = activities.find((item) => item.type === 0 && item.name?.trim());
  return {
    userId: user.id,
    status: STATUSES.includes(data.discord_status as DiscordStatus) ? (data.discord_status as DiscordStatus) : "offline",
    displayName: user.global_name || user.username,
    username: user.username,
    avatarUrl: user.avatar
      ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=128`
      : null,
    activity: custom?.state?.trim() || (playing?.name ? `Playing ${playing.name.trim()}` : null),
    spotify:
      data.listening_to_spotify && data.spotify?.song
        ? {
            song: data.spotify.song,
            artist: (data.spotify.artist || "").replace(/;\s*/g, ", "),
            albumArtUrl: data.spotify.album_art_url || null,
            trackId: data.spotify.track_id || null,
          }
        : null,
  };
}

/* -------------------------------------------------------------------------- */
/* Hiệu ứng                                                                   */
/* -------------------------------------------------------------------------- */

/** Xoay 3D theo vị trí con trỏ trong thẻ (tối đa `intensity` độ ở mép thẻ). */
export function getTiltTransform(x: number, y: number, width: number, height: number, intensity: number) {
  if (width <= 0 || height <= 0) return "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  const px = Math.min(1, Math.max(0, x / width)) - 0.5;
  const py = Math.min(1, Math.max(0, y / height)) - 0.5;
  // Góc dưới con trỏ chìm xuống: trái → rotateY dương, trên → rotateX âm.
  const rotateY = Number((-px * 2 * intensity).toFixed(2)) || 0;
  const rotateX = Number((py * 2 * intensity).toFixed(2)) || 0;
  return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1, 1, 1)`;
}


/**
 * URL của asset dựng sẵn (template) theo design, đè lên `assets`. API đã làm
 * việc này khi trả trang; hàm dùng cho khung xem trước của trình chỉnh sửa
 * (dữ liệu chưa lưu).
 */
export function withBuiltinDesignAssets(design: BioDesign, assets: BioDesignAssets): BioDesignAssets {
  const pick = (id: string | null, current: string | undefined) => resolveBioBuiltinAssetUrl(id) ?? current;
  return {
    ...assets,
    backgroundImageUrl: pick(design.background.imageAssetId, assets.backgroundImageUrl),
    backgroundVideoUrl: pick(design.background.videoAssetId, assets.backgroundVideoUrl),
    backgroundFallbackUrl: pick(design.background.fallbackImageAssetId, assets.backgroundFallbackUrl),
    backgroundMobileUrl: pick(design.background.mobileAssetId, assets.backgroundMobileUrl),
    videoPosterUrl: pick(design.background.video.posterAssetId, assets.videoPosterUrl),
    cursorUrl: pick(design.effects.cursor.assetId, assets.cursorUrl),
    enterBackgroundUrl: pick(design.effects.enter.backgroundAssetId, assets.enterBackgroundUrl),
    musicUrl: pick(design.audio.music.assetId, assets.musicUrl),
    musicCoverUrl: pick(design.audio.music.coverAssetId, assets.musicCoverUrl),
    musicTracks: getBioMusicTracks(design.audio.music).flatMap((track) => {
      const known = assets.musicTracks?.find((item) => item.assetId === track.assetId)?.url
        ?? (track.assetId === design.audio.music.assetId ? assets.musicUrl : undefined);
      const url = pick(track.assetId, known);
      return url ? [{ assetId: track.assetId, title: track.title, url }] : [];
    }),
  };
}
