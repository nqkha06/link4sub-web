"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useFormatter, useTranslations } from "next-intl";
import QRCode from "qrcode";

import {
  ArrowUpRight,
  Clapperboard,
  Eye,
  Link as LinkIcon,
  Music2,
  Radio,
  Users,
  Volume2,
  VolumeX,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { SiDiscord } from "@icons-pack/react-simple-icons";

import { BioWidgetEmbed } from "@/components/bio-widget-embed";
import { SocialIcon } from "@/features/link-in-bio/social-icon";
import { ThemeProvider } from "@/components/theme-provider";
import type { BioDesign } from "@/contracts";
import { getBioBackgroundPresetById } from "@/features/link-in-bio/backgrounds/background-presets";
import { getLinkAnimationClassName, getLinkAnimationStyle } from "@/features/link-in-bio/content-blocks/link-animation";
import {
  BankDetailsRenderer,
  DividerRenderer,
  TextBlockRenderer,
} from "@/features/link-in-bio/content-blocks/simple-content-renderers";
import { hasCompleteBankDetails } from "@/features/link-in-bio/content-blocks/simple-content-types";
import { GalleryRenderer } from "@/features/link-in-bio/gallery/gallery-renderer";
import { contentOrderKey, normalizeContentOrder } from "@/features/link-in-bio/gallery/gallery-types";
import { BioBackgroundEffect } from "@/features/link-in-bio/public/effects/bio-background-effect";
import { CursorTrail } from "@/features/link-in-bio/public/effects/cursor-trail";
import { BioPublicFonts, getBioFontStack } from "@/features/link-in-bio/public/bio-public-fonts";
import styles from "@/features/link-in-bio/public/VEXRO.module.css";
import {
  getProfileBadges,
  getTiltTransform,
  parseDiscordTarget,
  resolveBioDesign,
  withOpacity,
  type BioProfileBadge,
  type DiscordInvite,
  type DiscordPresence,
  type DiscordStatus,
  type DiscordTarget,
} from "@/features/link-in-bio/public/bio-public-model";
import { BioUsernameEffect } from "@/features/link-in-bio/public/username/bio-username-effect";
import { useDiscordPresence } from "@/features/link-in-bio/public/use-discord-presence";
import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";
import { trackBioClick, type BioCustomLinkDto, type BioPageDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Hằng số & tiện ích                                                         */
/* -------------------------------------------------------------------------- */

const BADGE_ICONS: Record<BioProfileBadge, LucideIcon> = {
  streamer: Radio,
  creator: Clapperboard,
  music: Music2,
  community: Users,
};

const DISCORD_STATUS_COLORS: Record<DiscordStatus, string> = {
  online: "#43b581",
  idle: "#faa61a",
  dnd: "#f04747",
  offline: "#747f8d",
};

/** Easing cho hiệu ứng xuất hiện; "spring" vượt quá một chút rồi về chỗ. */
const REVEAL_EASINGS = {
  ease: "ease",
  "ease-out": "cubic-bezier(0.22, 1, 0.36, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
} as const;
/** Các phần của thẻ hiện lần lượt cách nhau 300ms. */
const REVEAL_STEP_MS = 300;
const RESTING_TRANSFORM = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

function getYouTubeEmbedUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0] || ""
      : ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
        ? url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")
          ? url.pathname.split("/").filter(Boolean)[1] || ""
          : url.searchParams.get("v") || ""
        : "";
    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return "";
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return "";
  }
}

function getLinkHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/* -------------------------------------------------------------------------- */
/* Nền                                                                        */
/* -------------------------------------------------------------------------- */

type BackgroundMedia = { type: "image" | "video" | "youtube"; url: string };
type DesignAssets = ReturnType<typeof resolveBioDesign>["assets"];

function resolveBackground(bioPage: BioPageDto, design: BioDesign, hasDesign: boolean, assets: DesignAssets) {
  const { appearance } = bioPage;
  const bg = design.background;

  const legacyMedia: BackgroundMedia | null = appearance.backgroundMediaType && appearance.backgroundMediaUrl
    ? { type: appearance.backgroundMediaType, url: appearance.backgroundMediaUrl }
    : appearance.backgroundImage
      ? { type: "image", url: appearance.backgroundImage }
      : null;

  let media: BackgroundMedia | null = null;
  if (!hasDesign) {
    media = legacyMedia;
  } else if (bg.type === "image") {
    // Chưa chọn ảnh riêng trong Bio Design thì giữ nền cũ của trang.
    media = assets.backgroundImageUrl ? { type: "image", url: assets.backgroundImageUrl } : legacyMedia;
  } else if (bg.type === "video") {
    media = assets.backgroundVideoUrl ? { type: "video", url: assets.backgroundVideoUrl } : legacyMedia;
  }

  const preset = !media && (!hasDesign || bg.type === "image" || bg.type === "video")
    ? getBioBackgroundPresetById(appearance.selectedBackgroundId)
    : undefined;
  const fillColor = preset?.backgroundColor ?? bg.color;
  const fillImage = preset?.backgroundGradient
    ?? (hasDesign && bg.type === "gradient" ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})` : undefined);

  const filter = (hasDesign
    ? [
        bg.filter.blur ? `blur(${bg.filter.blur}px)` : "",
        bg.filter.brightness !== 100 ? `brightness(${bg.filter.brightness}%)` : "",
        bg.filter.contrast !== 100 ? `contrast(${bg.filter.contrast}%)` : "",
        bg.filter.saturation !== 100 ? `saturate(${bg.filter.saturation}%)` : "",
        bg.filter.grayscale ? `grayscale(${bg.filter.grayscale}%)` : "",
        bg.filter.hueRotate ? `hue-rotate(${bg.filter.hueRotate}deg)` : "",
        bg.filter.sepia ? `sepia(${bg.filter.sepia}%)` : "",
      ]
    : [
        appearance.backgroundBlur ? `blur(${appearance.backgroundBlur}px)` : "",
        appearance.backgroundBrightness && appearance.backgroundBrightness !== 100 ? `brightness(${appearance.backgroundBrightness}%)` : "",
      ]
  ).filter(Boolean).join(" ") || undefined;

  const overlay = hasDesign
    ? bg.overlay.enabled
      ? {
          background: bg.overlay.gradientEnabled
            ? `linear-gradient(${bg.overlay.gradientAngle}deg, ${bg.overlay.gradientFrom}, ${bg.overlay.gradientTo})`
            : bg.overlay.color,
          opacity: bg.overlay.opacity / 100,
        }
      : null
    : appearance.backgroundOverlay
      ? { background: "#000000", opacity: Math.min(80, Math.max(0, appearance.backgroundOverlay)) / 100 }
      : null;

  return { media, fillColor, fillImage, filter, overlay };
}

const subscribeNoop = () => () => {};

/**
 * true sau khi đã ở client. Dùng cho <video>/<audio>: một số tiện ích trình
 * duyệt (vd. nút lồng tiếng YouTube) chèn phần tử vào thẻ media trước khi React
 * hydrate, gây lỗi "Hydration failed". Không render chúng trong HTML từ server
 * thì không còn gì để lệch.
 */
function useIsClient() {
  return useSyncExternalStore(subscribeNoop, () => true, () => false);
}

function BioBackground({
  bioPage,
  design,
  hasDesign,
  assets,
  videoRef,
}: {
  bioPage: BioPageDto;
  design: BioDesign;
  hasDesign: boolean;
  assets: DesignAssets;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  const { media, fillColor, fillImage, filter, overlay } = resolveBackground(bioPage, design, hasDesign, assets);
  const bg = design.background;
  const position = hasDesign ? `${bg.positionX}% ${bg.positionY}%` : "50% center";
  const scale = hasDesign && bg.scale !== 100 ? `scale(${bg.scale / 100})` : undefined;
  const youtubeUrl = media?.type === "youtube" ? getYouTubeEmbedUrl(media.url) : "";
  const mobileImage = hasDesign
    ? assets.backgroundMobileUrl || (media?.type === "video" && bg.video.mobileMode === "static-image" ? assets.backgroundFallbackUrl || assets.videoPosterUrl : undefined)
    : undefined;
  const effect = design.effects.background;
  /* Video nền chỉ render ở client (xem useIsClient); lớp nền đen che khoảng trễ. */
  const isClient = useIsClient();

  return (
    <>
      {/*
        Có ảnh/video nền thì lớp dưới cùng để đen (giống guns.lol): trong lúc
        video/ảnh còn tải (F5) sẽ không bị "giật" màu nền của theme.
      */}
      <div aria-hidden className={styles.bgColor} style={{ backgroundColor: media ? "#000" : fillColor, backgroundImage: media ? undefined : fillImage }} />

      {media?.type === "image" ? (
        <div
          aria-hidden
          className={cn(styles.bgMedia, mobileImage && "max-sm:hidden")}
          style={{
            backgroundImage: `url("${media.url}")`,
            backgroundPosition: position,
            backgroundSize: hasDesign && bg.fit === "fill" ? "100% 100%" : hasDesign ? bg.fit : "cover",
            backgroundRepeat: hasDesign ? bg.repeat : "no-repeat",
            transform: scale,
            filter,
          }}
        />
      ) : null}

      {media?.type === "video" && isClient ? (
        <video
          ref={videoRef}
          onLoadedMetadata={hasDesign ? (event) => { event.currentTarget.playbackRate = bg.video.playbackRate; } : undefined}
          aria-hidden
          src={media.url}
          autoPlay
          muted
          loop={hasDesign ? bg.video.loop : true}
          playsInline
          disablePictureInPicture
          preload={hasDesign ? bg.video.preload : "metadata"}
          poster={assets.videoPosterUrl}
          className={cn(styles.bgMedia, hasDesign && bg.video.mobileMode !== "video" && "max-sm:hidden")}
          style={{ objectFit: hasDesign ? bg.fit : "cover", objectPosition: position, transform: scale, filter }}
        />
      ) : null}

      {mobileImage ? (
        <div aria-hidden className={cn(styles.bgMedia, "sm:hidden")} style={{ backgroundImage: `url("${mobileImage}")`, backgroundPosition: position, filter }} />
      ) : null}

      {youtubeUrl ? (
        <div aria-hidden className={cn(styles.bgMedia, "overflow-hidden")}>
          <iframe
            src={youtubeUrl}
            title="YouTube background"
            tabIndex={-1}
            allow="autoplay; encrypted-media; picture-in-picture"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[max(112vh,63vw)] w-[max(112vw,199vh)] -translate-x-1/2 -translate-y-1/2"
            style={{ filter }}
          />
        </div>
      ) : null}

      {overlay ? <div aria-hidden className={styles.bgOverlay} style={overlay} /> : null}

      <BioBackgroundEffect settings={effect} fallbackColor={design.appearance.colors.text} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Discord                                                                    */
/* -------------------------------------------------------------------------- */

function PlatformLabel() {
  return (
    <span className={styles.platformLabel}>
      <SiDiscord aria-hidden />
      Discord
    </span>
  );
}

function DiscordPresenceBox({ target, presence }: { target: Extract<DiscordTarget, { kind: "user" }>; presence: DiscordPresence | null }) {
  const t = useTranslations("LinkInBio.public");
  const status = presence
    ? presence.spotify
      ? t("discord.listening", { song: presence.spotify.song, artist: presence.spotify.artist })
      : presence.activity ?? t(`discord.status.${presence.status}`)
    : t("discord.openProfile");

  return (
    <a href={target.url} target="_blank" rel="noopener noreferrer" className={styles.secondTab}>
      <div className={styles.discordRow}>
        <div className={styles.discordMain}>
          <div className={styles.discordAvatar}>
            <span>
              {presence?.avatarUrl ? <img src={presence.avatarUrl} alt="" /> : <SiDiscord className="size-7" aria-hidden />}
            </span>
            {presence ? (
              <span
                className={styles.discordStatusDot}
                style={{ backgroundColor: DISCORD_STATUS_COLORS[presence.status] }}
                title={t(`discord.status.${presence.status}`)}
              />
            ) : null}
          </div>
          <div className={styles.discordText}>
            <h3 className={styles.discordTitle}>{presence?.displayName ?? t("discord.profile")}</h3>
            <p className={styles.discordMeta}>{status}</p>
          </div>
        </div>
        <PlatformLabel />
      </div>
    </a>
  );
}

function DiscordInviteBox({ target, invite }: { target: Extract<DiscordTarget, { kind: "invite" }>; invite: DiscordInvite | null }) {
  const t = useTranslations("LinkInBio.public");
  const format = useFormatter();

  return (
    <div className={styles.secondTab}>
      <div className={styles.discordRow}>
        <div className={styles.discordMain}>
          <div className={styles.discordIcon}>
            {invite?.iconUrl ? <img src={invite.iconUrl} alt="" /> : <SiDiscord className="size-7" aria-hidden />}
          </div>
          <div className={styles.discordText}>
            <h3 className={styles.discordTitle}>{invite?.name ?? t("discord.server")}</h3>
            {invite && invite.online !== null ? (
              <p className={styles.discordMeta}>
                <span><span className={styles.dot} style={{ backgroundColor: "rgb(35, 165, 89)" }} aria-hidden />{t("discord.online", { count: format.number(invite.online) })}</span>
                {invite.members !== null ? (
                  <span><span className={styles.dot} style={{ backgroundColor: "var(--discordServerMembers)" }} aria-hidden />{t("discord.members", { count: format.number(invite.members) })}</span>
                ) : null}
              </p>
            ) : null}
            <a href={target.url} target="_blank" rel="noopener noreferrer" className={styles.join}>
              {t("discord.join")}
            </a>
          </div>
        </div>
        <PlatformLabel />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Link                                                                       */
/* -------------------------------------------------------------------------- */

function LinkButton({ link, index, onClick }: { link: BioCustomLinkDto; index: number; onClick: () => void }) {
  const host = getLinkHost(link.url);
  return (
    <div className={styles.buttonRow}>
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label={`${link.title || host} — ${host}`}
        className={cn(styles.button, getLinkAnimationClassName(link.animationEffect))}
        style={getLinkAnimationStyle(index, 180)}
      >
        {link.iconUrl ? (
          <span className={styles.buttonIconWrap}>
            <img src={link.iconUrl} alt="" className={styles.buttonIcon} />
          </span>
        ) : null}
        <div className={cn(styles.buttonText, link.iconUrl && styles.withIconSpacer)}>
          <h3 className={styles.buttonTitle}>{link.title || host}</h3>
          <span className={styles.buttonUrl}>
            <LinkIcon aria-hidden />
            {host}
          </span>
        </div>
      </a>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* QR (desktop)                                                               */
/* -------------------------------------------------------------------------- */

function DesktopMobileQr({ pageName }: { pageName: string }) {
  const t = useTranslations("LinkInBio.public");
  const [imageSrc, setImageSrc] = useState("");

  useEffect(() => {
    let active = true;
    const publicUrl = new URL(window.location.href);
    publicUrl.search = "";
    publicUrl.hash = "";
    void QRCode.toDataURL(publicUrl.toString(), {
      width: 144,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0b0b10", light: "#ffffff" },
    })
      .then((value) => { if (active) setImageSrc(value); })
      .catch(() => { if (active) setImageSrc(""); });
    return () => { active = false; };
  }, []);

  if (!imageSrc) return null;

  return (
    <aside
      aria-label={t("qrTitle")}
      className={cn(styles.qrCard, "hidden lg:flex")}
    >
      <p className={styles.qrTitle}>{t("qrTitle")}</p>
      <div className={styles.qrCode}>
        <img src={imageSrc} alt={t("qrAlt", { name: pageName })} className="size-28" />
      </div>
    </aside>
  );
}

/* -------------------------------------------------------------------------- */
/* Biến CSS từ Bio Design                                                     */
/* -------------------------------------------------------------------------- */

function getDesignVars(design: BioDesign): React.CSSProperties {
  const { card, avatar } = design.profile;
  const colors = design.appearance.colors;
  const font = design.appearance.font;
  const links = design.appearance.links;
  const blocks = design.appearance.blocks;
  const username = design.effects.username;
  const social = design.effects.social;
  const badges = design.effects.badges;
  const text = colors.text;

  const glow = username.glowEnabled ? `0px 0px ${username.glowBlur}px ${withOpacity(username.glowColor, username.glowIntensity)}` : "";
  const shadow = font.usernameShadowEnabled ? `0 2px ${font.usernameShadowBlur}px ${font.usernameShadowColor}` : "";
  const flexAlign = links.alignment === "left" ? "flex-start" : links.alignment === "right" ? "flex-end" : "center";

  return {
    "--textColor": text,
    "--joinStatus": withOpacity(text, 65),
    "--iconColor": colors.icon,
    "--containerColor": card.enabled && !card.gradientEnabled ? withOpacity(card.backgroundColor, card.backgroundOpacity) : "transparent",
    "--containerGradient": card.enabled
      ? card.gradientEnabled
        ? `linear-gradient(${card.gradientAngle}deg, ${card.gradientFrom}, ${card.gradientTo})`
        : "linear-gradient(25deg, rgba(255, 255, 255, 0.03), rgba(99, 99, 99, 0.03))"
      : "none",
    "--containerBlur": `${card.enabled ? card.backdropBlur : 0}px`,
    "--containerBorder": card.enabled && card.borderEnabled ? `${card.borderWidth}px ${card.borderStyle} ${withOpacity(card.borderColor, card.borderOpacity)}` : "0 solid transparent",
    "--containerRadius": `${card.enabled ? card.borderRadius : 0}px`,
    "--containerWidth": `${design.profile.maxWidth}px`,
    "--containerPadding": `${design.profile.padding}px`,
    "--containerShadow": card.enabled && card.shadowEnabled ? `0 18px ${card.shadowBlur}px ${card.shadowSpread}px ${card.shadowColor}` : "none",
    "--contentGap": `${links.gap}px`,
    "--avatarSize": `${design.profile.layoutMode === "compact" ? Math.min(avatar.size, 72) : avatar.size}px`,
    "--avatarRadius": avatar.shape === "circle" ? "50%" : avatar.shape === "square" ? "0px" : `${avatar.radius}px`,
    "--avatarBorder": avatar.borderEnabled ? `${avatar.borderWidth}px solid ${avatar.borderColor}` : "0 solid transparent",
    "--avatarGlow": avatar.glowEnabled ? `0 0 ${Math.round(avatar.glowIntensity / 2)}px ${avatar.glowColor}` : "none",
    "--avatarFit": avatar.objectFit,
    "--usernameFont": getBioFontStack(font.usernameFamily),
    "--usernameSize": `${font.usernameSize}px`,
    "--usernameWeight": String(font.usernameWeight),
    "--usernameLetterSpacing": `${font.usernameLetterSpacing}px`,
    "--usernameTransform": font.textTransform,
    "--colorUsernameGlow": [glow, shadow].filter(Boolean).join(", ") || "none",
    "--usernameEffects": username.gradientEnabled ? `linear-gradient(${username.gradientAngle}deg, ${username.gradientFrom}, ${username.gradientTo})` : "none",
    "--descriptionSize": `${font.descriptionSize}px`,
    "--badgeContainerBackground": withOpacity(text, 20),
    "--badgeContainerBorder": `2px solid ${withOpacity(text, 4)}`,
    "--badgeColor": badges.glowEnabled ? badges.glowColor : text,
    "--badgeGlow": badges.glowEnabled ? `drop-shadow(${badges.glowColor} 0px 0px 2.5px)` : "none",
    "--userBadge": "18px",
    "--secondTabBackground": withOpacity(blocks.backgroundColor, blocks.backgroundOpacity),
    "--secondTabBorder": `2px solid ${blocks.borderColor}`,
    "--discordServerMembers": withOpacity(text, 60),
    "--discordMissingIcon": withOpacity(text, 25),
    "--discordAvatarBorder": `2px solid ${withOpacity(text, 15)}`,
    "--platformTextColor": withOpacity(text, 40),
    "--buttonBackground": links.backgroundColor,
    "--buttonBorder": `${links.borderWidth}px solid ${links.borderColor}`,
    "--buttonRadius": `${links.radius}px`,
    "--buttonAlign": links.alignment,
    "--buttonFlexAlign": flexAlign,
    "--buttonBackgroundHover": `color-mix(in srgb, ${links.backgroundColor}, #ffffff 13%)`,
    "--buttonBorderHover": `${links.borderWidth}px solid color-mix(in srgb, ${links.borderColor}, #ffffff 15%)`,
    "--buttonUrlColor": colors.link,
    "--buttonShadow": links.shadow ? "0 10px 30px -12px rgba(0, 0, 0, 0.6)" : "none",
    "--socialGlow": social.glowEnabled ? `drop-shadow(${withOpacity(social.glowColor, social.glowIntensity)} 1px 0px 7px)` : "none",
    "--socialHoverDuration": `${social.hoverDuration}ms`,
    "--socialHoverTransform": { none: "none", scale: "scale(1.1)", lift: "translateY(-3px)", glow: "scale(1.05)" }[social.hoverEffect],
    "--volumeBackgroundcolor": withOpacity(text, 3),
    "--volumeBorder": `2px solid ${withOpacity(text, 3)}`,
    /* Biến cho các renderer dùng chung (chữ, ngân hàng, gallery, widget). */
    "--bio-accent": colors.primary,
    "--bio-accent-rgb": "255, 255, 255",
    "--bio-text": text,
    "--bio-muted-text": withOpacity(text, 65),
    "--bio-section-bg": withOpacity(blocks.backgroundColor, blocks.backgroundOpacity),
    "--bio-section-border": blocks.borderColor,
    "--bio-surface-bg": "rgba(0, 0, 0, 0.35)",
    "--bio-surface-border": colors.border,
    "--bio-button-text": text,
    "--bio-effect-color": design.effects.background.color,
    "--bio-effect-opacity": String(design.effects.background.opacity / 100),
    "--bio-effect-speed": `${Math.max(0.1, 4 / design.effects.background.speed)}s`,
    fontFamily: getBioFontStack(font.family),
    fontSize: font.bodySize,
    fontWeight: font.bodyWeight,
    lineHeight: font.lineHeight,
  } as React.CSSProperties;
}

/* -------------------------------------------------------------------------- */
/* Trang                                                                      */
/* -------------------------------------------------------------------------- */

export function PublicBioView({
  bioPage,
  discordInvite = null,
  preview = false,
}: {
  bioPage: BioPageDto;
  discordInvite?: DiscordInvite | null;
  /**
   * Render trong khung xem trước của trình chỉnh sửa (đặt trong .previewFrame):
   * không ép theme toàn trang, không đếm lượt click, không hiện QR, gốc là <div>.
   */
  preview?: boolean;
}) {
  const t = useTranslations("LinkInBio.public");
  const format = useFormatter();
  const brand = useSiteBrand();
  const brandIconUrl = brand.branding?.logoIcon?.downloadUrl || null;
  const { design, hasDesign, assets } = resolveBioDesign(bioPage);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- giữ lại để khôi phục sau khi test
  const reducedMotion = usePrefersReducedMotion();

  const tiltRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isClient = useIsClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(design.audio.music.volume);
  const [entered, setEntered] = useState(false);
  const [overlayGone, setOverlayGone] = useState(false);
  const enteredThisSession = useSyncExternalStore(
    () => () => undefined,
    () => {
      try {
        return design.effects.enter.showOncePerSession && window.sessionStorage.getItem(`bio-entered:${bioPage.id}`) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );

  // "Shuffle Audios": mỗi lượt xem chọn ngẫu nhiên một bài. Chỉ chọn ở client
  // (thẻ <audio> vốn chỉ render ở client) để SSR và hydrate khớp nhau.
  const [shuffleSeed] = useState(() => Math.random());
  const shuffleTracks = design.audio.music.shuffle && isClient ? (assets.musicTracks ?? []) : [];
  const shuffledTrack = shuffleTracks.length > 1 ? shuffleTracks[Math.floor(shuffleSeed * shuffleTracks.length)] : undefined;
  const musicUrl = design.audio.music.enabled ? (shuffledTrack?.url ?? assets.musicUrl) : undefined;
  const musicTitle = shuffledTrack?.title ?? design.audio.music.title;
  // Xem trước trong trình chỉnh sửa: chỉ hiện màn "click to enter" khi người dùng bật nó,
  // không tự hiện vì nhạc "on-enter" (nếu không cả thẻ bị ẩn sau lớp phủ).
  const needsEnter = design.effects.enter.enabled || (!preview && Boolean(musicUrl && design.audio.music.startMode === "on-enter"));
  const showOverlay = needsEnter && !overlayGone && !enteredThisSession;
  /* Lần render đầu (cả SSR) để các phần ở trạng thái ẩn, rồi mới bật để chạy transition. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  const revealed = mounted && (!needsEnter || entered || enteredThisSession);
  const animation = design.effects.profile;
  const revealStep = Math.min(REVEAL_STEP_MS, Math.round(animation.duration * 0.75));
  let revealIndex = 0;
  const reveal = (className?: string, style?: React.CSSProperties) => ({
    className: cn(className, styles.reveal, revealed && styles.revealed),
    style: { ...style, "--reveal-delay": `${revealIndex++ * revealStep}ms` } as React.CSSProperties,
  });

  /*
   * Video nền tạm dừng khi rời tab (đỡ tốn tài nguyên). Nhạc thì KHÔNG dừng:
   * người xem chuyển tab vẫn nghe tiếp.
   */
  useEffect(() => {
    const onVisibilityChange = () => {
      const video = videoRef.current;
      if (!video || !design.background.video.pauseWhenHidden) return;
      if (document.hidden) video.pause();
      else void video.play().catch(() => undefined);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [design.background.video.pauseWhenHidden]);

  useEffect(() => {
    if (videoRef.current && hasDesign) videoRef.current.playbackRate = design.background.video.playbackRate;
  }, [design.background.video.playbackRate, hasDesign]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const playMusic = useCallback(async () => {
    await audioRef.current?.play().catch(() => undefined);
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await playMusic();
    else audio.pause();
  };

  const enterProfile = async () => {
    setEntered(true);
    window.setTimeout(() => setOverlayGone(true), 750);
    if (design.effects.enter.showOncePerSession) {
      try { window.sessionStorage.setItem(`bio-entered:${bioPage.id}`, "1"); } catch { /* bỏ qua */ }
    }
    const video = videoRef.current;
    if (video && hasDesign && !design.background.video.muted) {
      video.muted = false;
      void video.play().catch(() => undefined);
    }
    if (musicUrl && (design.effects.enter.startAudioOnClick || design.audio.music.startMode === "on-enter")) {
      await playMusic();
    }
  };

  /* Thẻ nghiêng 3D theo con trỏ chuột. */
  // TẠM TẮT ĐỂ TEST: bỏ qua "Reduce motion" như guns.lol. Khôi phục bằng:
  // const tiltEnabled = design.effects.profile.parallaxEnabled && !reducedMotion;
  const tiltEnabled = design.effects.profile.parallaxEnabled;
  const onTiltMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!tiltEnabled || event.pointerType !== "mouse" || !tiltRef.current) return;
    const rect = tiltRef.current.getBoundingClientRect();
    tiltRef.current.style.transform = getTiltTransform(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
      design.effects.profile.parallaxIntensity,
    );
  };
  const onTiltLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = RESTING_TRANSFORM;
  };

  const trackClick = () => {
    if (preview) return;
    void trackBioClick(bioPage.slug).catch(() => undefined);
  };

  /* Dữ liệu */
  const display = design.profile.display;
  const font = design.appearance.font;
  const visibleSocials = bioPage.socialLinks.filter((social) => social.enabled !== false && social.url.trim());
  const discordSocial = visibleSocials.find((social) => social.platform.trim().toLowerCase() === "discord");
  const discordTarget = parseDiscordTarget(discordSocial?.url);
  const presence = useDiscordPresence(discordTarget?.kind === "user" ? discordTarget.id : null);
  const badges = display.showBadges ? getProfileBadges(bioPage.socialLinks, bioPage.widgets) : [];
  const joinedAt = bioPage.createdAt;
  const isClassic = design.profile.layoutMode === "classic";

  const orderedContent = normalizeContentOrder(bioPage.contentOrder, {
    socials: bioPage.socialLinks,
    widgets: bioPage.widgets,
    galleries: bioPage.galleries,
    dividers: bioPage.dividers,
    bankDetails: bioPage.bankDetails,
    textBlocks: bioPage.textBlocks,
    links: bioPage.customLinks,
  });

  const cursorCss = hasDesign && design.effects.cursor.type === "custom" && assets.cursorUrl
    ? `.${styles.page}, .${styles.page} * { cursor: url(${JSON.stringify(assets.cursorUrl)}) ${design.effects.cursor.hotspotX} ${design.effects.cursor.hotspotY}, auto !important; }`
    : "";

  const contentNodes = orderedContent.map((item, contentIndex) => {
    const key = contentOrderKey(item);

    if (item.type === "social") {
      if (!visibleSocials.length) return null;
      return (
        <nav key={key} aria-label={t("socials")} className={styles.socials}>
          {visibleSocials.slice(0, 12).map((social) => (
            <a
              key={social.id}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.platform}
              title={social.platform}
              onClick={trackClick}
              className={styles.social}
            >
              <SocialIcon platform={social.platform} />
            </a>
          ))}
        </nav>
      );
    }

    if (item.type === "gallery") {
      const gallery = bioPage.galleries.find((entry) => entry.id === item.id);
      return gallery?.enabled && gallery.images.length ? <GalleryRenderer key={key} gallery={gallery} onExternalLink={trackClick} /> : null;
    }

    if (item.type === "divider") {
      const block = bioPage.dividers.find((entry) => entry.id === item.id);
      return block?.enabled ? <DividerRenderer key={key} block={block} /> : null;
    }

    if (item.type === "bank-details") {
      const block = bioPage.bankDetails.find((entry) => entry.id === item.id);
      return block?.enabled && hasCompleteBankDetails(block) ? <BankDetailsRenderer key={key} block={block} /> : null;
    }

    if (item.type === "text") {
      const block = bioPage.textBlocks.find((entry) => entry.id === item.id);
      return block?.enabled && block.content.trim() ? <TextBlockRenderer key={key} block={block} /> : null;
    }

    if (item.type === "widget") {
      const widget = bioPage.widgets.find((entry) => entry.id === item.id && entry.enabled !== false);
      return widget ? (
        <div key={key} className={styles.embed}>
          <BioWidgetEmbed widget={widget} onExternalLink={trackClick} />
        </div>
      ) : null;
    }

    const link = bioPage.customLinks.find((entry) => entry.id === item.id);
    if (!link || bioPage.hiddenLinks.includes(link.id)) return null;
    return <LinkButton key={key} link={link} index={contentIndex} onClick={trackClick} />;
  });

  const hasContent = contentNodes.some(Boolean);

  const Root = preview ? "div" : "main";
  const content = (
    <>
      <BioPublicFonts families={[font.family, font.usernameFamily]} />
      {cursorCss ? <style>{cursorCss}</style> : null}

      <Root
        // Xem trước: không có ThemeProvider ép "dark" cho cả trang quản trị, nên
        // gắn class "dark" ngay trên gốc để các khối dùng biến thể dark: vẫn đúng.
        className={cn(styles.page, preview && "dark")}
        data-anim={animation.type}
        style={{
          ...getDesignVars(design),
          "--reveal-duration": `${animation.duration}ms`,
          "--reveal-base-delay": `${animation.delay}ms`,
          "--reveal-easing": REVEAL_EASINGS[animation.type === "bounce" ? "spring" : animation.easing],
        } as React.CSSProperties}
      >
        <BioBackground bioPage={bioPage} design={design} hasDesign={hasDesign} assets={assets} videoRef={videoRef} />
        {hasDesign && design.effects.cursor.trailEnabled && design.effects.cursor.trailType !== "none" ? (
          <CursorTrail type={design.effects.cursor.trailType} color={design.effects.cursor.trailColor} length={design.effects.cursor.trailLength} />
        ) : null}

        <div
          className={styles.center}
          style={{
            justifyContent: design.profile.verticalAlign === "top" ? "flex-start" : design.profile.verticalAlign === "bottom" ? "flex-end" : "center",
          }}
        >
          <div className={cn("w-full", animation.floatEnabled && styles.float)} style={{ maxWidth: "var(--containerWidth)" }}>
          <div ref={tiltRef} className={styles.tilt} onPointerMove={onTiltMove} onPointerLeave={onTiltLeave}>
            <article
              aria-labelledby="bio-profile-name"
              {...reveal(
                cn(styles.container, { lift: styles.hoverLift, scale: styles.hoverScale, glow: styles.hoverGlow, none: "" }[animation.hoverEffect]),
                { minHeight: design.profile.minHeight ?? undefined },
              )}
            >
              <header
                {...reveal(cn(styles.header, isClassic && styles.headerClassic), { gap: display.profileHeaderGap })}
              >
                {display.showAvatar ? (
                  bioPage.appearance.avatarUrl ? (
                    <div className={styles.avatar}>
                      <img src={bioPage.appearance.avatarUrl} alt={t("avatarAlt", { name: bioPage.name })} />
                    </div>
                  ) : (
                    <span className={styles.avatarPlaceholder} aria-hidden>
                      <svg width="1em" height="1em" viewBox="4 4 16 16">
                        <path fill="currentColor" d="M12 4a4 4 0 1 1 0 8a4 4 0 0 1 0-8m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4" />
                      </svg>
                    </span>
                  )
                ) : null}

                <div className={styles.nameBlock}>
                  <div className={styles.nameRow}>
                    <BioUsernameEffect
                      as="h1"
                      id="bio-profile-name"
                      text={bioPage.name}
                      effect={design.effects.username.type}
                      className={cn(styles.username, design.effects.username.gradientEnabled && styles.usernameGradient)}
                    />
                    {badges.length && display.badgePosition === "after-username" ? <BadgeRow badges={badges} /> : null}
                  </div>
                  {badges.length && display.badgePosition === "separate-row" ? <BadgeRow badges={badges} separate /> : null}
                  {display.showDescription && bioPage.title?.trim() ? (
                    <p className={styles.description} style={{ textAlign: isClassic ? "center" : display.descriptionAlignment }}>
                      {bioPage.title}
                    </p>
                  ) : null}
                  {display.showJoinDate && joinedAt ? (
                    <h2 className={styles.joined} suppressHydrationWarning>
                      {t("joined", { time: format.relativeTime(new Date(joinedAt), new Date()) })}
                    </h2>
                  ) : null}
                </div>
              </header>

              {discordTarget ? (
                <div {...reveal(styles.widgets)}>
                  <div className={styles.widgetRow}>
                    <div className={styles.widgetCell}>
                      {discordTarget.kind === "user" ? (
                        <DiscordPresenceBox target={discordTarget} presence={presence} />
                      ) : (
                        <DiscordInviteBox target={discordTarget} invite={discordInvite} />
                      )}
                    </div>
                  </div>
                </div>
              ) : null}

              <div
                {...reveal(styles.content)}
              >
                {contentNodes}
                {!hasContent && !discordTarget ? <p className={styles.empty}>{t("empty")}</p> : null}
              </div>

              {display.showViewCount ? <div className={styles.viewsSpacer} aria-hidden /> : null}
            </article>

            {display.showViewCount ? (
              <div {...reveal(styles.views)} title={t("views")}>
                <Eye aria-hidden />
                <span className="sr-only">{t("views")}: </span>
                {format.number(bioPage.views)}
              </div>
            ) : null}
          </div>
          </div>

          <Link href="/member/create" className={styles.footerLink} title={t("createYoursLabel", { siteName: brand.siteName })}>
            <span className={styles.footerIcon} aria-hidden>
              {brandIconUrl ? <img src={brandIconUrl} alt="" /> : <Sparkles />}
            </span>
            <span className={styles.footerText}>
              {t.rich("createYours", { siteName: brand.siteName, brand: (chunks) => <strong>{chunks}</strong> })}
            </span>
            <ArrowUpRight className={styles.footerArrow} aria-hidden />
          </Link>
        </div>

        {musicUrl ? (
          <>
            {isClient ? (
              <audio
                ref={audioRef}
                src={musicUrl}
                onLoadedMetadata={(event) => { event.currentTarget.volume = volume / 100; }}
                loop={design.audio.music.loop}
                // Tải sẵn nhạc trong lúc người xem còn ở màn "click to enter" → bấm là phát ngay.
                preload="auto"
                onPlay={() => setMusicPlaying(true)}
                onPause={() => setMusicPlaying(false)}
              />
            ) : null}
            {design.audio.player.visible ? (
              <div className={styles.volume}>
                <button
                  type="button"
                  onClick={() => void toggleMusic()}
                  aria-label={musicPlaying ? t("music.pause") : t("music.play")}
                  title={musicTitle || undefined}
                >
                  {musicPlaying && volume > 0 ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  aria-label={t("music.volume")}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {showOverlay ? (
          <button
            type="button"
            onClick={() => void enterProfile()}
            className={cn(styles.enter, entered && styles.enterHidden)}
            style={{
              color: design.effects.enter.textColor,
              backgroundColor: design.effects.enter.backgroundType === "blur" ? undefined : design.effects.enter.backgroundColor,
              backgroundImage: design.effects.enter.backgroundType === "image" && assets.enterBackgroundUrl ? `url("${assets.enterBackgroundUrl}")` : undefined,
              backdropFilter: design.effects.enter.backgroundType === "blur" ? undefined : "none",
            }}
          >
            <span className={styles.enterText}>{design.effects.enter.title || t("enter")}</span>
            {design.effects.enter.subtitle ? <span className={styles.enterSub}>{design.effects.enter.subtitle}</span> : null}
          </button>
        ) : null}

        {preview ? null : <DesktopMobileQr pageName={bioPage.name} />}
      </Root>
    </>
  );

  if (preview) return content;
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      {content}
    </ThemeProvider>
  );
}

function BadgeRow({ badges, separate = false }: { badges: BioProfileBadge[]; separate?: boolean }) {
  const t = useTranslations("LinkInBio.public");
  return (
    <ul aria-label={t("badges.label")} className={styles.badges} style={separate ? { marginLeft: 0, width: "fit-content" } : undefined}>
      {badges.map((badge) => {
        const Icon = BADGE_ICONS[badge];
        const label = t(`badges.${badge}`);
        return (
          <li key={badge} title={label}>
            <Icon aria-hidden />
            <span className="sr-only">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
