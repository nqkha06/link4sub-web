import type { LucideIcon } from "lucide-react"
import { Building2, Link, UserPlus } from "lucide-react"
import {
  SiApplemusic,
  SiAppstore,
  SiAudiomack,
  SiBandcamp,
  SiBeatstars,
  SiBehance,
  SiBluesky,
  SiDeezer,
  SiDeviantart,
  SiDiscord,
  SiDribbble,
  SiFacebook,
  SiGithub,
  SiGoogleplay,
  SiInstagram,
  SiKick,
  SiLinkerd,
  SiOnlyfans,
  SiPinterest,
  SiProducthunt,
  SiReddit,
  SiRoblox,
  SiRumble,
  SiSnapchat,
  SiSoundcloud,
  SiSpotify,
  SiSteam,
  SiTelegram,
  SiThreads,
  SiTidal,
  SiTiktok,
  SiTwitch,
  SiVimeo,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "@icons-pack/react-simple-icons"

import { platformCategories } from "@/features/link-creation/catalog"

/**
 * Platform + action catalog for the /create (anonymous) link composer.
 *
 * This intentionally mirrors the data shape used by the member dashboard's
 * link creator (features/link-creation/components/link-creator.tsx), but is
 * a standalone copy — the anonymous composer is a separate component per
 * design decision, so it does not import the member component or its
 * internal state. Keep this file in sync with the member catalog if a
 * platform/action is added there and should also be offered to anonymous
 * visitors.
 */

export type SocialActionItem = {
  id: string
  label: string
  requiresUrl: boolean
  icon: LucideIcon
}

export type SocialPlatform = {
  name: string
  icon: LucideIcon
  color: string
  category?: string
  actions: SocialActionItem[]
}

const baseSocialPlatforms: Record<string, SocialPlatform> = {
  youtube: {
    name: "YouTube",
    icon: SiYoutube,
    color: "bg-red-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: SiYoutube },
      { id: "subscribe-notifications", label: "Subscribe & turn on notifications", requiresUrl: true, icon: SiYoutube },
      { id: "like", label: "Like a video", requiresUrl: true, icon: SiYoutube },
      { id: "comment", label: "Comment on a video", requiresUrl: true, icon: SiYoutube },
      { id: "like-comment", label: "Like & comment on video", requiresUrl: true, icon: SiYoutube },
      { id: "watch", label: "Watch video", requiresUrl: true, icon: SiYoutube },
    ],
  },
  twitter: {
    name: "X/Twitter",
    icon: SiX,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiX },
      { id: "like", label: "Like post", requiresUrl: true, icon: SiX },
      { id: "reply", label: "Reply to post", requiresUrl: true, icon: SiX },
      { id: "repost", label: "Repost", requiresUrl: true, icon: SiX },
    ],
  },
  instagram: {
    name: "Instagram",
    icon: SiInstagram,
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiInstagram },
      { id: "like", label: "Like user", requiresUrl: true, icon: SiInstagram },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiInstagram },
    ],
  },
  tiktok: {
    name: "TikTok",
    icon: SiTiktok,
    color: "bg-black",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiTiktok },
      { id: "like", label: "Like post", requiresUrl: true, icon: SiTiktok },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiTiktok },
    ],
  },
  facebook: {
    name: "Facebook",
    icon: SiFacebook,
    color: "bg-blue-600",
    actions: [
      { id: "like-page", label: "Like page", requiresUrl: true, icon: SiFacebook },
      { id: "like-post", label: "Like post", requiresUrl: true, icon: SiFacebook },
      { id: "comment", label: "Comment on post", requiresUrl: true, icon: SiFacebook },
      { id: "share", label: "Share post", requiresUrl: true, icon: SiFacebook },
    ],
  },
  discord: {
    name: "Discord",
    icon: SiDiscord,
    color: "bg-indigo-600",
    actions: [{ id: "join-server", label: "Join server", requiresUrl: true, icon: SiDiscord }],
  },
  telegram: {
    name: "Telegram",
    icon: SiTelegram,
    color: "bg-sky-500",
    actions: [{ id: "join-channel", label: "Join channel", requiresUrl: true, icon: SiTelegram }],
  },
  spotify: {
    name: "Spotify",
    icon: SiSpotify,
    color: "bg-green-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiSpotify },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: SiSpotify },
    ],
  },
  twitch: {
    name: "Twitch",
    icon: SiTwitch,
    color: "bg-purple-600",
    actions: [{ id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: SiTwitch }],
  },
  vimeo: {
    name: "Vimeo",
    icon: SiVimeo,
    color: "bg-sky-500",
    actions: [{ id: "follow-creator", label: "Follow creator", requiresUrl: true, icon: SiVimeo }],
  },
  threads: {
    name: "Threads",
    icon: SiThreads,
    color: "bg-black",
    actions: [{ id: "follow", label: "Follow user", requiresUrl: true, icon: SiThreads }],
  },
  linkedin: {
    name: "LinkedIn",
    icon: SiLinkerd,
    color: "bg-blue-700",
    actions: [
      { id: "connect", label: "Connect", requiresUrl: true, icon: UserPlus },
      { id: "follow-company", label: "Follow company", requiresUrl: true, icon: Building2 },
    ],
  },
  pinterest: {
    name: "Pinterest",
    icon: SiPinterest,
    color: "bg-red-600",
    actions: [{ id: "follow", label: "Follow user", requiresUrl: true, icon: SiPinterest }],
  },
  snapchat: {
    name: "Snapchat",
    icon: SiSnapchat,
    color: "bg-yellow-400",
    actions: [{ id: "add-user", label: "Add user", requiresUrl: true, icon: SiSnapchat }],
  },
  reddit: {
    name: "Reddit",
    icon: SiReddit,
    color: "bg-orange-600",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiReddit },
      { id: "upvote", label: "Upvote post", requiresUrl: true, icon: SiReddit },
    ],
  },
  whatsapp: {
    name: "WhatsApp",
    icon: SiWhatsapp,
    color: "bg-green-500",
    actions: [{ id: "join-group", label: "Join group", requiresUrl: true, icon: SiWhatsapp }],
  },
  bluesky: {
    name: "Bluesky",
    icon: SiBluesky,
    color: "bg-sky-500",
    actions: [{ id: "follow", label: "Follow user", requiresUrl: true, icon: SiBluesky }],
  },
  soundcloud: {
    name: "SoundCloud",
    icon: SiSoundcloud,
    color: "bg-orange-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiSoundcloud },
      { id: "like-track", label: "Like track", requiresUrl: true, icon: SiSoundcloud },
      { id: "repost-track", label: "Repost track", requiresUrl: true, icon: SiSoundcloud },
    ],
  },
  deezer: {
    name: "Deezer",
    icon: SiDeezer,
    color: "bg-purple-600",
    actions: [{ id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiDeezer }],
  },
  kick: {
    name: "Kick",
    icon: SiKick,
    color: "bg-lime-500",
    actions: [{ id: "follow-streamer", label: "Follow streamer", requiresUrl: true, icon: SiKick }],
  },
  rumble: {
    name: "Rumble",
    icon: SiRumble,
    color: "bg-green-600",
    actions: [
      { id: "subscribe", label: "Subscribe to channel", requiresUrl: true, icon: SiRumble },
      { id: "like-video", label: "Like video", requiresUrl: true, icon: SiRumble },
    ],
  },
  roblox: {
    name: "Roblox",
    icon: SiRoblox,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiRoblox },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: SiRoblox },
      { id: "favorite-game", label: "Favorite game", requiresUrl: true, icon: SiRoblox },
      { id: "like-game", label: "Like game", requiresUrl: true, icon: SiRoblox },
    ],
  },
  steam: {
    name: "Steam",
    icon: SiSteam,
    color: "bg-slate-800",
    actions: [
      { id: "follow-curator", label: "Follow curator", requiresUrl: true, icon: SiSteam },
      { id: "comment-profile", label: "Comment on profile", requiresUrl: true, icon: SiSteam },
      { id: "join-group", label: "Join group", requiresUrl: true, icon: SiSteam },
    ],
  },
  behance: {
    name: "Behance",
    icon: SiBehance,
    color: "bg-blue-600",
    actions: [{ id: "follow", label: "Follow user", requiresUrl: true, icon: SiBehance }],
  },
  dribbble: {
    name: "Dribbble",
    icon: SiDribbble,
    color: "bg-pink-500",
    actions: [
      { id: "follow-designer", label: "Follow designer", requiresUrl: true, icon: SiDribbble },
      { id: "like-shot", label: "Like shot", requiresUrl: true, icon: SiDribbble },
    ],
  },
  deviantart: {
    name: "DeviantArt",
    icon: SiDeviantart,
    color: "bg-green-600",
    actions: [
      { id: "watch-artist", label: "Watch artist", requiresUrl: true, icon: SiDeviantart },
      { id: "favorite-artwork", label: "Favorite artwork", requiresUrl: true, icon: SiDeviantart },
    ],
  },
  appleMusic: {
    name: "Apple Music",
    icon: SiApplemusic,
    color: "bg-pink-500",
    actions: [{ id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiApplemusic }],
  },
  audiomack: {
    name: "Audiomack",
    icon: SiAudiomack,
    color: "bg-yellow-500",
    actions: [
      { id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiAudiomack },
      { id: "like-song", label: "Like song", requiresUrl: true, icon: SiAudiomack },
    ],
  },
  beatstars: {
    name: "BeatStars",
    icon: SiBeatstars,
    color: "bg-red-600",
    actions: [{ id: "follow", label: "Follow user", requiresUrl: true, icon: SiBeatstars }],
  },
  bandcamp: {
    name: "Bandcamp",
    icon: SiBandcamp,
    color: "bg-sky-600",
    actions: [{ id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiBandcamp }],
  },
  tidal: {
    name: "Tidal",
    icon: SiTidal,
    color: "bg-black",
    actions: [{ id: "follow-artist", label: "Follow artist", requiresUrl: true, icon: SiTidal }],
  },
  onlyfans: {
    name: "OnlyFans",
    icon: SiOnlyfans,
    color: "bg-sky-500",
    actions: [{ id: "view-page", label: "View page", requiresUrl: true, icon: SiOnlyfans }],
  },
  github: {
    name: "GitHub",
    icon: SiGithub,
    color: "bg-gray-900",
    actions: [
      { id: "follow", label: "Follow user", requiresUrl: true, icon: SiGithub },
      { id: "star-repository", label: "Star repository", requiresUrl: true, icon: SiGithub },
    ],
  },
  productHunt: {
    name: "Product Hunt",
    icon: SiProducthunt,
    color: "bg-orange-600",
    actions: [
      { id: "upvote-product", label: "Upvote product", requiresUrl: true, icon: SiProducthunt },
      { id: "follow-maker", label: "Follow maker", requiresUrl: true, icon: SiProducthunt },
    ],
  },
  googlePlay: {
    name: "Google Play Store",
    icon: SiGoogleplay,
    color: "bg-green-600",
    actions: [{ id: "install-app", label: "Install app", requiresUrl: true, icon: SiGoogleplay }],
  },
  appStore: {
    name: "iOS App Store",
    icon: SiAppstore,
    color: "bg-blue-600",
    actions: [{ id: "install-app", label: "Install app", requiresUrl: true, icon: SiAppstore }],
  },
  other: {
    name: "Other",
    icon: Link,
    color: "bg-gray-700",
    actions: [{ id: "visit-page", label: "Visit a page", requiresUrl: true, icon: Link }],
  },
}

export type PopularActionOption = {
  platform: keyof typeof baseSocialPlatforms
  action: SocialActionItem
}

const popularActionMappings: Array<{ platform: keyof typeof baseSocialPlatforms; actionId: string }> = [
  { platform: "youtube", actionId: "subscribe" },
  { platform: "youtube", actionId: "subscribe-notifications" },
  { platform: "other", actionId: "visit-page" },
  { platform: "discord", actionId: "join-server" },
  { platform: "telegram", actionId: "join-channel" },
  { platform: "tiktok", actionId: "follow" },
  { platform: "instagram", actionId: "follow" },
]

export const popularActionOptions: PopularActionOption[] = popularActionMappings.flatMap(({ platform, actionId }) => {
  const action = baseSocialPlatforms[platform].actions.find((item) => item.id === actionId)
  return action ? [{ platform, action }] : []
})

export const socialPlatforms: Record<string, SocialPlatform> = Object.fromEntries(
  Object.entries(baseSocialPlatforms).map(([key, platform]) => [
    key,
    { ...platform, category: platformCategories[key] ?? "Other" },
  ]),
)

const platformIconColors: Record<string, string> = {
  youtube: "text-red-600 dark:text-red-400",
  twitter: "text-foreground",
  instagram: "text-pink-600 dark:text-pink-400",
  tiktok: "text-foreground",
  facebook: "text-blue-600 dark:text-blue-400",
  discord: "text-indigo-600 dark:text-indigo-400",
  telegram: "text-sky-600 dark:text-sky-400",
  spotify: "text-green-600 dark:text-green-400",
  twitch: "text-purple-600 dark:text-purple-400",
  vimeo: "text-sky-600 dark:text-sky-400",
  threads: "text-foreground",
  linkedin: "text-blue-700 dark:text-blue-400",
  pinterest: "text-red-600 dark:text-red-400",
  snapchat: "text-yellow-600 dark:text-yellow-300",
  reddit: "text-orange-600 dark:text-orange-400",
  whatsapp: "text-green-600 dark:text-green-400",
  bluesky: "text-sky-600 dark:text-sky-400",
  soundcloud: "text-orange-600 dark:text-orange-400",
  deezer: "text-purple-600 dark:text-purple-400",
  kick: "text-lime-600 dark:text-lime-400",
  rumble: "text-green-600 dark:text-green-400",
  roblox: "text-foreground",
  steam: "text-slate-700 dark:text-slate-300",
  behance: "text-blue-600 dark:text-blue-400",
  dribbble: "text-pink-600 dark:text-pink-400",
  deviantart: "text-green-600 dark:text-green-400",
  appleMusic: "text-pink-600 dark:text-pink-400",
  audiomack: "text-yellow-600 dark:text-yellow-300",
  beatstars: "text-red-600 dark:text-red-400",
  bandcamp: "text-sky-600 dark:text-sky-400",
  tidal: "text-foreground",
  onlyfans: "text-sky-600 dark:text-sky-400",
  github: "text-foreground",
  productHunt: "text-orange-600 dark:text-orange-400",
  googlePlay: "text-green-600 dark:text-green-400",
  appStore: "text-blue-600 dark:text-blue-400",
  other: "text-muted-foreground",
}

export function getPlatformIconClass(platform: string) {
  return platformIconColors[platform] || "text-muted-foreground"
}

export interface SocialAction {
  id: string
  platform: keyof typeof socialPlatforms
  action: string
  url: string
  isValid: boolean
}

export function toPlatformKey(platform: string): keyof typeof socialPlatforms {
  return platform in socialPlatforms ? (platform as keyof typeof socialPlatforms) : "other"
}

export function isValidUrl(value: string) {
  try {
    const url = new URL(value.trim())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export function formatActionTarget(value: string) {
  try {
    const url = new URL(value)
    const segments = url.pathname.split("/").filter(Boolean)
    const target = segments.at(-1)
    return target ? decodeURIComponent(target) : url.hostname.replace(/^www\./, "")
  } catch {
    return value
  }
}

export function getLocalDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
