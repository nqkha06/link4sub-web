"use client";

import type { ComponentType } from "react";
import { ExternalLink, Headphones, Info, Music2, PlayCircle } from "lucide-react";
import { SiInstagram, SiSpotify, SiTiktok, SiTwitch, SiYoutube } from "@icons-pack/react-simple-icons";

import { cn } from "@/lib/utils";
import {
  BIO_MUTED_SURFACE_CLASS,
  BIO_MUTED_TEXT_CLASS,
  BIO_SECTION_SURFACE_CLASS,
} from "@/features/link-in-bio/theme-classes";

export type BioWidgetEmbedData = {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
};

export type BioWidgetPlatformOption = {
  value: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  placeholder: string;
};

export const bioWidgetPlatformOptions: BioWidgetPlatformOption[] = [
  {
    value: "youtube-video",
    label: "YouTube",
    icon: SiYoutube,
    placeholder: "https://www.youtube.com/watch?v=...",
  },
  {
    value: "tiktok-video",
    label: "TikTok",
    icon: SiTiktok,
    placeholder: "https://www.tiktok.com/@user/video/...",
  },
  {
    value: "spotify-track",
    label: "Spotify",
    icon: SiSpotify,
    placeholder: "https://open.spotify.com/track/...",
  },
  {
    value: "instagram-post",
    label: "Instagram",
    icon: SiInstagram,
    placeholder: "https://www.instagram.com/p/...",
  },
  {
    value: "twitch-stream",
    label: "Twitch",
    icon: SiTwitch,
    placeholder: "https://www.twitch.tv/ten-kenh",
  },
  {
    value: "audio-preview",
    label: "Audio",
    icon: Headphones,
    placeholder: "https://.../bai-hat.mp3",
  },
];

function getYouTubeEmbedUrl(value: string) {
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
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function getSpotifyEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname.replace(/^www\./, "") !== "open.spotify.com") return "";
    const [type, id] = url.pathname.split("/").filter(Boolean).filter((part) => part !== "embed");
    return ["track", "album", "playlist", "episode", "show"].includes(type) && id
      ? `https://open.spotify.com/embed/${type}/${id}`
      : "";
  } catch {
    return "";
  }
}

function getInstagramEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "instagram.com") return "";
    const [type, id] = url.pathname.split("/").filter(Boolean);
    return ["p", "reel", "tv"].includes(type) && id
      ? `https://www.instagram.com/${type}/${id}/embed/captioned/`
      : "";
  } catch {
    return "";
  }
}

function getTwitchChannel(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.hostname.replace(/^www\./, "") !== "twitch.tv") return "";
    const channel = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[a-zA-Z0-9_]{1,25}$/.test(channel) ? channel : "";
  } catch {
    return "";
  }
}

function getTikTokEmbedUrl(value: string) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (!["tiktok.com", "m.tiktok.com"].includes(host)) return "";
    const playerId = url.pathname.match(/^\/player\/v1\/(\d+)/)?.[1];
    const postId = url.pathname.match(/^\/@[^/]+\/video\/(\d+)/)?.[1];
    const id = playerId || postId || "";
    return /^\d{10,}$/.test(id)
      ? `https://www.tiktok.com/player/v1/${id}?controls=1&description=1`
      : "";
  } catch {
    return "";
  }
}

function getWidgetLabel(widget: BioWidgetEmbedData) {
  return widget.title || widget.type.replace(/-/g, " ");
}

export function BioWidgetEmbed({
  widget,
  onExternalLink,
}: {
  widget: BioWidgetEmbedData;
  onExternalLink?: () => void;
}) {
  const label = getWidgetLabel(widget);
  const hasUrl = Boolean(widget.url.trim());
  const youtubeUrl = getYouTubeEmbedUrl(widget.url);
  const spotifyUrl = getSpotifyEmbedUrl(widget.url);
  const instagramUrl = getInstagramEmbedUrl(widget.url);
  const twitchChannel = getTwitchChannel(widget.url);
  const tikTokUrl = getTikTokEmbedUrl(widget.url);

  const hostname = typeof window === "undefined" ? "" : window.location.hostname;

  if (!hasUrl) {
    return (
      <div
        className={cn(
          "flex min-h-32 items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center text-sm",
          "border-[color:var(--bio-section-border,var(--border))]",
          BIO_MUTED_SURFACE_CLASS,
          BIO_MUTED_TEXT_CLASS,
        )}
      >
        <Info className="size-4" />
        Thêm URL để xem widget thật.
      </div>
    );
  }

  if (widget.type === "youtube-video" && youtubeUrl) {
    return <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={youtubeUrl} title={label} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className="size-full" /></div>;
  }

  if (widget.type === "spotify-track" && spotifyUrl) {
    return <iframe src={spotifyUrl} title={label} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="h-[152px] w-full overflow-hidden rounded-xl border-0" />;
  }

  if (widget.type === "instagram-post" && instagramUrl) {
    return <iframe src={instagramUrl} title={label} loading="lazy" className="h-[480px] w-full rounded-xl border-0 bg-white" />;
  }

  if (widget.type === "tiktok-video" && tikTokUrl) {
    return <div className="mx-auto aspect-[9/16] max-h-[640px] max-w-[360px] overflow-hidden rounded-xl bg-black"><iframe src={tikTokUrl} title={label} allow="fullscreen" allowFullScreen className="size-full" /></div>;
  }

  if (widget.type === "audio-preview") {
    return (
      <div
        className={cn(
          "rounded-xl border p-4",
          "border-[color:var(--bio-section-border,var(--border))]",
          BIO_MUTED_SURFACE_CLASS,
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Music2 className="size-4" />
          {label}
        </div>
        <audio controls preload="metadata" className="w-full" src={widget.url}>
          Trình duyệt của bạn không hỗ trợ phát audio.
        </audio>
      </div>
    );
  }

  if (widget.type === "twitch-stream" && twitchChannel && hostname) {
    return <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={`https://player.twitch.tv/?channel=${encodeURIComponent(twitchChannel)}&parent=${encodeURIComponent(hostname)}&muted=true`} title={label} allowFullScreen className="size-full" /></div>;
  }

  const platformIcon = widget.type === "youtube-video" ? <SiYoutube className="size-5 text-red-600" /> : widget.type === "spotify-track" ? <SiSpotify className="size-5 text-emerald-600" /> : widget.type === "instagram-post" ? <SiInstagram className="size-5 text-pink-600" /> : widget.type === "tiktok-video" ? <SiTiktok className="size-5" /> : widget.type === "twitch-stream" ? <SiTwitch className="size-5 text-violet-600" /> : widget.type === "audio-preview" ? <Headphones className="size-5 text-blue-600" /> : <PlayCircle className="size-5" />;

  return (
    <a
      href={widget.url}
      onClick={onExternalLink}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex min-h-28 items-center gap-3 rounded-xl p-4 transition-colors",
        BIO_SECTION_SURFACE_CLASS,
        "hover:bg-[color:var(--bio-accent)]/10",
      )}
    >
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", BIO_MUTED_SURFACE_CLASS)}>
        {platformIcon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{label}</span>
        <span className={cn("mt-1 block truncate text-sm", BIO_MUTED_TEXT_CLASS)}>
          Không thể nhúng URL này — mở nội dung gốc.
        </span>
      </span>
      <ExternalLink className={cn("size-4 shrink-0", BIO_MUTED_TEXT_CLASS)} />
    </a>
  );
}
