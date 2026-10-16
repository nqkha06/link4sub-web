"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type React from "react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import {
  Banknote,
  Headphones,
  Users,
} from "lucide-react";

import {
  SiCashapp,
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiLinkerd,
  SiPaypal,
  SiReddit,
  SiSpotify,
  SiTiktok,
  SiTwitch,
  SiVenmo,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons";

import { BioWidgetEmbed } from "@/components/bio-widget-embed";
import { PublicCreatorLayout } from "@/components/public-creator-layout";
import { ThemeProvider } from "@/components/theme-provider";

import {
  BankDetailsRenderer,
  DividerRenderer,
  TextBlockRenderer,
} from "@/features/link-in-bio/content-blocks/simple-content-renderers";

import {
  hasCompleteBankDetails,
} from "@/features/link-in-bio/content-blocks/simple-content-types";

import { BioLinkButton } from "@/features/link-in-bio/components/bio-link-button";

import {
  getBioBackgroundPresetById,
  getBioPresetTheme,
} from "@/features/link-in-bio/backgrounds/background-presets";

import { GalleryRenderer } from "@/features/link-in-bio/gallery/gallery-renderer";
import {
  BIO_CONTENT_STACK_CLASS,
  BIO_FOOTER_CLASS,
  BIO_HEADER,
  BIO_SOCIAL_ICON_CLASS,
  BIO_SOCIAL_ROW_CLASS,
} from "@/features/link-in-bio/bio-spacing";
import { cn } from "@/lib/utils";

import {
  contentOrderKey,
  normalizeContentOrder,
} from "@/features/link-in-bio/gallery/gallery-types";

import { useSiteBrand } from "@/features/site-settings/components/site-brand-provider";

import {
  trackBioClick,
  type BioPageDto,
} from "@/lib/api-client";

function getSocialIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case "youtube":
      return <SiYoutube className="size-[18px]" />;
    case "instagram":
      return <SiInstagram className="size-[18px]" />;
    case "facebook":
      return <SiFacebook className="size-[18px]" />;
    case "tiktok":
      return <SiTiktok className="size-[18px]" />;
    case "twitter":
    case "x":
      return <SiX className="size-[18px]" />;
    case "linkedin":
      return <SiLinkerd className="size-[18px]" />;
    case "reddit":
      return <SiReddit className="size-[18px]" />;
    case "discord":
      return <SiDiscord className="size-[18px]" />;
    case "twitch":
      return <SiTwitch className="size-[18px]" />;
    case "spotify":
      return <SiSpotify className="size-[18px]" />;
    case "apple music":
      return <Headphones className="size-[18px]" />;
    case "paypal":
      return <SiPaypal className="size-[18px]" />;
    case "venmo":
      return <SiVenmo className="size-[18px]" />;
    case "cashapp":
      return <SiCashapp className="size-[18px]" />;
    case "money":
    case "payment":
      return <Banknote className="size-[18px]" />;
    default:
      return <Users className="size-[18px]" />;
  }
}

function parseHexColor(value?: string | null) {
  if (!value?.startsWith("#")) {
    return null;
  }

  const hex = value.replace("#", "").trim();

  const fullHex =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;

  if (!/^[0-9a-f]{6}$/i.test(fullHex)) {
    return null;
  }

  return {
    r: Number.parseInt(fullHex.slice(0, 2), 16),
    g: Number.parseInt(fullHex.slice(2, 4), 16),
    b: Number.parseInt(fullHex.slice(4, 6), 16),
  };
}

function getYouTubeEmbedUrl(value?: string | null) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value.trim());

    const host = url.hostname.replace(/^www\./, "");

    const id =
      host === "youtu.be"
        ? url.pathname.split("/").filter(Boolean)[0] || ""
        : ["youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
          ? url.pathname.startsWith("/shorts/") ||
            url.pathname.startsWith("/embed/")
            ? url.pathname.split("/").filter(Boolean)[1] || ""
            : url.searchParams.get("v") || ""
          : "";

    if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) {
      return "";
    }

    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&playsinline=1&modestbranding=1&rel=0`;
  } catch {
    return "";
  }
}

function getBackgroundMedia(bioPage: BioPageDto) {
  const {
    backgroundMediaType,
    backgroundMediaUrl,
    backgroundImage,
  } = bioPage.appearance;

  if (backgroundMediaType && backgroundMediaUrl) {
    return {
      type: backgroundMediaType,
      url: backgroundMediaUrl,
    };
  }

  if (backgroundImage) {
    return {
      type: "image" as const,
      url: backgroundImage,
    };
  }

  return null;
}

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return "B";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function DesktopMobileQr({
  pageName,
}: {
  pageName: string;
}) {
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
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((value) => {
        if (active) {
          setImageSrc(value);
        }
      })
      .catch(() => {
        if (active) {
          setImageSrc("");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!imageSrc) {
    return null;
  }

  return (
    <aside
      aria-label="Mở Link Bio trên điện thoại"
      className="
        fixed bottom-6 right-6 z-40
        hidden w-44 flex-col items-center
        rounded-[1.25rem]
        border border-white/80
        bg-white/95
        p-3
        shadow-[0_18px_55px_rgba(15,23,42,0.24)]
        backdrop-blur-md

        lg:flex
      "
    >
      <p className="mb-2 text-center text-sm font-semibold text-slate-900">
        Xem trên điện thoại
      </p>

      <div className="rounded-xl border border-slate-200 bg-white p-1.5">
        <img
          src={imageSrc}
          alt={`Mã QR mở trang ${pageName} trên điện thoại`}
          className="size-32"
        />
      </div>
    </aside>
  );
}

export function PublicBioView({
  bioPage,
}: {
  bioPage: BioPageDto;
}) {
  const brand = useSiteBrand();

  const visibleLinks = bioPage.customLinks.filter(
    (link) => !bioPage.hiddenLinks.includes(link.id),
  );

  const visibleSocials = bioPage.socialLinks.filter(
    (social) => social.enabled !== false,
  );

  const visibleWidgets = bioPage.widgets.filter(
    (widget) => widget.enabled !== false,
  );

  const visibleGalleries = bioPage.galleries.filter(
    (gallery) =>
      gallery.enabled &&
      gallery.images.length > 0,
  );

  const visibleDividers = bioPage.dividers.filter(
    (block) => block.enabled,
  );

  const visibleBankDetails = bioPage.bankDetails.filter(
    (block) =>
      block.enabled &&
      hasCompleteBankDetails(block),
  );

  const visibleTextBlocks = bioPage.textBlocks.filter(
    (block) => block.enabled && block.content.trim(),
  );

  const trackClick = () => {
    void trackBioClick(bioPage.slug).catch(
      () => undefined,
    );
  };

  const orderedContent = normalizeContentOrder(
    bioPage.contentOrder,
    {
      socials: bioPage.socialLinks,
      widgets: bioPage.widgets,
      galleries: bioPage.galleries,
      dividers: bioPage.dividers,
      bankDetails: bioPage.bankDetails,
      textBlocks: bioPage.textBlocks,
      links: bioPage.customLinks,
    },
  );

  const totalContent =
    visibleLinks.length +
    visibleSocials.length +
    visibleWidgets.length +
    visibleGalleries.length +
    visibleDividers.length +
    visibleBankDetails.length +
    visibleTextBlocks.length;

  const backgroundMedia = getBackgroundMedia(bioPage);
  const solidPreset = backgroundMedia
    ? undefined
    : getBioBackgroundPresetById(bioPage.appearance.selectedBackgroundId);
  const solidBackgroundColor = solidPreset?.backgroundColor;

  const youtubeEmbedUrl =
    backgroundMedia?.type === "youtube"
      ? getYouTubeEmbedUrl(backgroundMedia.url)
      : "";

  const backgroundFilter =
    [
      bioPage.appearance.backgroundBlur
        ? `blur(${bioPage.appearance.backgroundBlur}px)`
        : "",
      bioPage.appearance.backgroundBrightness &&
      bioPage.appearance.backgroundBrightness !== 100
        ? `brightness(${bioPage.appearance.backgroundBrightness}%)`
        : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const backgroundOverlayOpacity =
    Math.min(80, Math.max(0, bioPage.appearance.backgroundOverlay || 0)) /
    100;

  const theme = getBioPresetTheme(
    bioPage.appearance.selectedBackgroundId,
    bioPage.appearance.backgroundImage,
    bioPage.appearance.backgroundColor,
  );

  const accentRgb =
    parseHexColor(theme.accentColor) ?? {
      r: 37,
      g: 99,
      b: 235,
    };

  const pageVariables = {
    "--bio-accent": theme.accentColor,
    "--bio-accent-rgb":
      `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,

    "--bio-section-bg": theme.sectionColor,
    "--bio-section-border":
      theme.sectionBorderColor,

    "--bio-text": theme.textColor,
    "--bio-muted-text": theme.mutedTextColor,

    "--bio-surface-bg": theme.surfaceColor,
    "--bio-surface-border": theme.surfaceBorderColor,
    "--bio-surface-bg-soft":
      `color-mix(in srgb, ${theme.surfaceColor} 60%, transparent)`,
    "--bio-surface-border-soft":
      `color-mix(in srgb, ${theme.surfaceBorderColor} 70%, transparent)`,

    "--bio-button-text": theme.buttonTextColor,
  } as React.CSSProperties;

  const backgroundLayers = (
    <>
    {/* Fallback background */}
    <div
      aria-hidden="true"
      className="
        pointer-events-none
        absolute inset-0
        bg-[#f4f7fb]
      "
    />

    {/* Solid color BG */}
    {solidBackgroundColor ? (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundColor: solidBackgroundColor,
          backgroundImage: solidPreset?.backgroundGradient,
          filter:
            bioPage.appearance.backgroundBrightness &&
            bioPage.appearance.backgroundBrightness !== 100
              ? `brightness(${bioPage.appearance.backgroundBrightness}%)`
              : undefined,
        }}
      />
    ) : null}

    {/* Image BG */}
    {backgroundMedia?.type === "image" ? (
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute -inset-4
          scale-[1.02]
          bg-cover bg-center
        "
        style={{
          backgroundImage: `url("${backgroundMedia.url}")`,
          filter: backgroundFilter,
        }}
      />
    ) : null}

    {/* Video BG */}
    {backgroundMedia?.type === "video" ? (
      <video
        aria-hidden="true"
        src={backgroundMedia.url}
        autoPlay
        muted
        loop
        playsInline
        className="
          pointer-events-none
          absolute inset-0
          size-full
          object-cover
        "
        style={{ filter: backgroundFilter }}
      />
    ) : null}

    {/* YouTube BG */}
    {youtubeEmbedUrl ? (
      <iframe
        aria-hidden="true"
        src={youtubeEmbedUrl}
        title="YouTube background"
        allow="autoplay; encrypted-media; picture-in-picture"
        className="
          pointer-events-none
          absolute left-1/2 top-1/2
          h-[150%]
          w-[266%]
          -translate-x-1/2
          -translate-y-1/2
        "
        style={{ filter: backgroundFilter }}
      />
    ) : null}

    {/* Độ tối (overlay) do người dùng tự chỉnh trong Giao diện */}
    {backgroundOverlayOpacity > 0 ? (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${backgroundOverlayOpacity})` }}
      />
    ) : null}
    </>
  );

  return (
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      <PublicCreatorLayout
        forceLightFallback
        themeVars={pageVariables}
        className="
        items-stretch
        px-4
        pb-[max(1.5rem,env(safe-area-inset-bottom))]
        pt-2

        sm:px-7
        sm:pb-8
        sm:pt-4
      "
      layout="column"
      background={backgroundLayers}
      columnBackground={
        backgroundMedia?.type === "video" || backgroundMedia?.type === "youtube"
          ? undefined
          : backgroundLayers
      }
    >
      <article
        aria-labelledby="bio-profile-name"
        style={{
          ...pageVariables,
          color: theme.textColor,
        }}
        className="relative flex w-full flex-1 flex-col"
      >
        <div className="flex flex-1 flex-col pb-2 pt-4 sm:pt-6">
          {/* Profile */}
          <header className="text-center">
            <div
              className={BIO_HEADER.avatar}
              style={{
                boxShadow: `
                  0 10px 30px rgba(2,6,23,.20),
                  0 0 0 1px ${theme.surfaceBorderColor}
                `,
              }}
            >
              <span>
                {getInitials(bioPage.name)}
              </span>

              {bioPage.appearance.avatarUrl ? (
                <img
                  src={bioPage.appearance.avatarUrl}
                  alt={`Ảnh đại diện của ${bioPage.name}`}
                  className="
                    absolute inset-0
                    size-full
                    object-cover
                  "
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              ) : null}
            </div>

            <h1
              id="bio-profile-name"
              className={BIO_HEADER.name}
              style={{
                color: theme.textColor,
              }}
            >
              {bioPage.name}
            </h1>

            <p
              className={BIO_HEADER.handle}
              style={{
                color: theme.mutedTextColor,
              }}
            >
              @{bioPage.slug}
            </p>

            {bioPage.title ? (
              <p
                className={BIO_HEADER.description}
                style={{
                  color: theme.mutedTextColor,
                }}
              >
                {bioPage.title}
              </p>
            ) : null}
          </header>

          {/* Content */}
          <div className={BIO_CONTENT_STACK_CLASS}>
            {orderedContent.map(
              (item, contentIndex) => {
                if (item.type === "social") {
                  if (!visibleSocials.length) {
                    return null;
                  }

                  return (
                    <nav
                      key={contentOrderKey(item)}
                      aria-label="Mạng xã hội"
                      className={BIO_SOCIAL_ROW_CLASS}
                    >
                      {visibleSocials
                        .slice(0, 8)
                        .map(
                          ({
                            id,
                            url,
                            platform,
                          }) => (
                            <a
                              key={id}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={platform}
                              title={platform}
                              onClick={trackClick}
                              className={cn(
                                BIO_SOCIAL_ICON_CLASS,
                                "transition duration-200 hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bio-accent)] motion-reduce:hover:translate-y-0",
                              )}
                              style={{
                                color: theme.textColor,
                                backgroundColor:
                                  theme.sectionColor,
                                borderColor:
                                  theme.sectionBorderColor,
                              }}
                            >
                              {getSocialIcon(
                                platform,
                              )}
                            </a>
                          ),
                        )}
                    </nav>
                  );
                }

                if (item.type === "gallery") {
                  const gallery =
                    bioPage.galleries.find(
                      (entry) =>
                        entry.id === item.id,
                    );

                  if (
                    !gallery ||
                    !gallery.enabled ||
                    !gallery.images.length
                  ) {
                    return null;
                  }

                  return (
                    <GalleryRenderer
                      key={contentOrderKey(item)}
                      gallery={gallery}
                      onExternalLink={trackClick}
                    />
                  );
                }

                if (item.type === "divider") {
                  const block =
                    bioPage.dividers.find(
                      (entry) =>
                        entry.id === item.id,
                    );

                  if (!block?.enabled) {
                    return null;
                  }

                  return (
                    <DividerRenderer
                      key={contentOrderKey(item)}
                      block={block}
                    />
                  );
                }

                if (
                  item.type === "bank-details"
                ) {
                  const block =
                    bioPage.bankDetails.find(
                      (entry) =>
                        entry.id === item.id,
                    );

                  if (
                    !block?.enabled ||
                    !hasCompleteBankDetails(
                      block,
                    )
                  ) {
                    return null;
                  }

                  return (
                    <BankDetailsRenderer
                      key={contentOrderKey(item)}
                      block={block}
                    />
                  );
                }

                if (item.type === "text") {
                  const block =
                    bioPage.textBlocks.find(
                      (entry) =>
                        entry.id === item.id,
                    );

                  if (
                    !block?.enabled ||
                    !block.content.trim()
                  ) {
                    return null;
                  }

                  return (
                    <TextBlockRenderer
                      key={contentOrderKey(item)}
                      block={block}
                    />
                  );
                }

                if (item.type === "widget") {
                  const widget =
                    visibleWidgets.find(
                      (entry) =>
                        entry.id === item.id,
                    );

                  if (!widget) {
                    return null;
                  }

                  return (
                    <BioWidgetEmbed
                      key={contentOrderKey(item)}
                      widget={widget}
                      onExternalLink={trackClick}
                    />
                  );
                }

                const link =
                  visibleLinks.find(
                    (entry) =>
                      entry.id === item.id,
                  );

                if (!link) {
                  return null;
                }

                return (
                  <BioLinkButton
                    key={contentOrderKey(item)}
                    link={link}
                    buttonStyle={
                      bioPage.appearance
                        .buttonStyle
                    }
                    theme={theme}
                    contentIndex={
                      contentIndex
                    }
                    onClick={trackClick}
                  />
                );
              },
            )}

            {totalContent === 0 ? (
              <div
                className="
                  rounded-2xl
                  border border-dashed
                  px-6 py-10
                  text-center
                "
                style={{
                  backgroundColor:
                    theme.sectionColor,
                  borderColor:
                    theme.sectionBorderColor,
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{
                    color:
                      theme.mutedTextColor,
                  }}
                >
                  Trang này chưa có nội dung.
                </p>
              </div>
            ) : null}
          </div>

          <footer className={BIO_FOOTER_CLASS}>
            <Link
              href="/member/create"
              className="
                inline-flex min-h-12 items-center justify-center
                rounded-full
                bg-white
                px-6 py-3
                text-center text-sm font-semibold text-slate-950
                shadow-[0_10px_30px_rgba(2,6,23,0.18)]
                transition-transform duration-200
                hover:-translate-y-0.5
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[color:var(--bio-accent)]
                motion-reduce:transform-none
              "
            >
              Tạo trang của bạn trên {brand.siteName}
            </Link>
          </footer>
        </div>
      </article>
      </PublicCreatorLayout>
      <DesktopMobileQr pageName={bioPage.name} />
    </ThemeProvider>
  );
}
