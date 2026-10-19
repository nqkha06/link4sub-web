"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BellRing,
  ExternalLink,
  Eye,
  FileText,
  Globe2,
  Loader2,
  LockKeyhole,
  MessageCircle,
  MousePointerClick,
  Repeat2,
  Reply,
  ThumbsUp,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  ChevronsRight,
  type LucideIcon,
  Check,
  FileX,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { PublicCreatorLayout } from "@/components/public-creator-layout";
import { LINK_BACKGROUND_IMAGE_PRESETS } from "@/features/link-creation/background-image-presets";
import {
  completePublicLinkVisit,
  type LinkDto,
} from "@/lib/api-client";
import { generateUuid } from "@/lib/id";
import { cn } from "@/lib/utils";
import { socialPlatforms } from "@/features/create-link/social-catalog";
import { getMonetizationActionIcon } from "@/lib/monetization-action-icons";
import {
  MONETIZATION_ACTION_HISTORY_KEY,
  nextMonetizationCooldownExpiry,
  recordMonetizationActionClick,
  visibleActionsAfterCooldown,
  type MonetizationActionHistory,
} from "@/lib/monetization-action-cooldown";

const ACTION_DELAY_SECONDS = 6;
const DEVICE_ID_STORAGE_KEY = "stu:device-id";

// Kỹ thuật phát hiện AdBlock kinh điển: tạo 1 phần tử "mồi" mang class name
// thường bị các bộ lọc quảng cáo chặn (ẩn/xoá qua CSS), rồi kiểm tra xem nó
// có thực sự hiển thị hay không. Không chính xác 100% với mọi AdBlock,
// nhưng bắt được phần lớn các trình chặn quảng cáo phổ biến.
function detectAdBlock(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const bait = document.createElement("div");
      bait.className =
        "adsbox ad-banner ads ad-placement pub_300x250 textads banner_ad";
      bait.style.position = "absolute";
      bait.style.left = "-9999px";
      bait.style.top = "-9999px";
      bait.style.width = "1px";
      bait.style.height = "1px";
      document.body.appendChild(bait);
      window.setTimeout(() => {
        const blocked =
          bait.offsetParent === null ||
          bait.offsetHeight === 0 ||
          bait.offsetWidth === 0 ||
          window.getComputedStyle(bait).display === "none" ||
          window.getComputedStyle(bait).visibility === "hidden";
        bait.remove();
        resolve(blocked);
      }, 100);
    } catch {
      resolve(false);
    }
  });
}

function getOrCreateDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing) return existing;
    const generated = generateUuid();
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
    return generated;
  } catch {
    return "";
  }
}

type PublicMonetizationAd = NonNullable<LinkDto["monetizationAds"]>[number];

function injectedAdDocument(ad: PublicMonetizationAd) {
  const css = (ad.content.css ?? "").replace(/<\/style/gi, "<\\/style");
  const javascript = (ad.content.javascript ?? "").replace(
    /<\/script/gi,
    "<\\/script",
  );

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{box-sizing:border-box;margin:0;min-height:100%;overflow:auto;background:transparent}*,*:before,*:after{box-sizing:inherit}${css}</style></head><body>${ad.content.html ?? ""}<script>${javascript}<\/script></body></html>`;
}

function InjectedHtmlAd({ ad }: { ad: PublicMonetizationAd }) {
  const height = Math.min(2_000, Math.max(40, ad.content.height ?? 250));

  return (
    <iframe
      title={`Quảng cáo ${ad.id}`}
      srcDoc={injectedAdDocument(ad)}
      sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="strict-origin-when-cross-origin"
      className="block w-full border-0 bg-transparent"
      style={{ height }}
    />
  );
}

function splitActions<T>(actions: T[], requestedPageCount: number) {
  const pageCount = Math.max(
    1,
    Math.min(requestedPageCount, Math.max(1, actions.length)),
  );
  const baseSize = Math.floor(actions.length / pageCount);
  const remainder = actions.length % pageCount;
  let offset = 0;
  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const size = baseSize + (pageIndex < remainder ? 1 : 0);
    const page = actions.slice(offset, offset + size);
    offset += size;
    return page;
  });
}

// Compatibility fallback for links saved before backgroundMediaUrl was persisted.
const backgroundImages = LINK_BACKGROUND_IMAGE_PRESETS;

const actionLabels: Record<string, string> = {
  subscribe: "Subscribe to channel",
  "subscribe-notifications": "Subscribe & turn on notifications",
  like: "Like",
  comment: "Comment",
  "like-comment": "Like & comment",
  watch: "Watch",
  follow: "Follow user",
  "tiktok-follow": "Follow user",
  repost: "Repost",
  reply: "Reply",
  "join-server": "Join server",
  "join-channel": "Join channel",
  "follow-artist": "Follow artist",
  "follow-streamer": "Follow streamer",
  "visit-page": "Visit page",
  "other-visit": "Visit website",
};

const actionIcons: Record<string, LucideIcon> = {
  subscribe: UserPlus,
  "subscribe-notifications": BellRing,
  like: ThumbsUp,
  comment: MessageCircle,
  "like-comment": MessageCircle,
  watch: Eye,
  follow: UserPlus,
  "tiktok-follow": UserPlus,
  repost: Repeat2,
  reply: Reply,
  "join-server": Users,
  "join-channel": Users,
  "follow-artist": UserPlus,
  "follow-streamer": UserPlus,
  "visit-page": Globe2,
  "other-visit": Globe2,
};

const platformColors: Record<string, string> = {
  popular: "bg-red-600 hover:bg-red-700",
  youtube: "bg-red-600 hover:bg-red-700",

  twitter: "bg-black hover:bg-slate-900",
  x: "bg-black hover:bg-slate-900",

  instagram:
    "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-95",

  tiktok: "bg-black hover:bg-slate-900",

  facebook: "bg-blue-600 hover:bg-blue-700",
  discord: "bg-indigo-600 hover:bg-indigo-700",
  telegram: "bg-sky-500 hover:bg-sky-600",
  spotify: "bg-green-500 hover:bg-green-600",
  twitch: "bg-purple-600 hover:bg-purple-700",
  vimeo: "bg-sky-500 hover:bg-sky-600",
  threads: "bg-black hover:bg-slate-900",
  linkedin: "bg-blue-700 hover:bg-blue-800",
  pinterest: "bg-red-600 hover:bg-red-700",
  snapchat: "bg-yellow-400 hover:bg-yellow-500",
  reddit: "bg-orange-600 hover:bg-orange-700",
  whatsapp: "bg-green-500 hover:bg-green-600",
  bluesky: "bg-sky-500 hover:bg-sky-600",
  soundcloud: "bg-orange-500 hover:bg-orange-600",
  deezer: "bg-purple-600 hover:bg-purple-700",
  kick: "bg-lime-500 hover:bg-lime-600",
  rumble: "bg-green-600 hover:bg-green-700",
  roblox: "bg-gray-900 hover:bg-black",
  steam: "bg-slate-800 hover:bg-slate-900",
  behance: "bg-blue-600 hover:bg-blue-700",
  dribbble: "bg-pink-500 hover:bg-pink-600",
  deviantart: "bg-green-600 hover:bg-green-700",

  appleMusic: "bg-pink-500 hover:bg-pink-600",
  "apple-music": "bg-pink-500 hover:bg-pink-600",

  audiomack: "bg-yellow-500 hover:bg-yellow-600",
  beatstars: "bg-red-600 hover:bg-red-700",
  bandcamp: "bg-sky-600 hover:bg-sky-700",
  tidal: "bg-black hover:bg-slate-900",
  onlyfans: "bg-sky-500 hover:bg-sky-600",
  github: "bg-gray-900 hover:bg-black",

  productHunt: "bg-orange-600 hover:bg-orange-700",
  "product-hunt": "bg-orange-600 hover:bg-orange-700",

  googlePlay: "bg-green-600 hover:bg-green-700",
  "google-play": "bg-green-600 hover:bg-green-700",

  appStore: "bg-blue-600 hover:bg-blue-700",
  "app-store": "bg-blue-600 hover:bg-blue-700",

  other: "bg-gray-700 hover:bg-gray-800",
};

function getActionIcon(action: string): LucideIcon {
  return actionIcons[action] ?? MousePointerClick;
}

const platformAliases: Record<string, string> = {
  x: "twitter",
  "apple-music": "appleMusic",
  "product-hunt": "productHunt",
  "google-play": "googlePlay",
  "app-store": "appStore",
};

/** Logo nền tảng (YouTube, TikTok…) từ danh mục dùng ở form tạo link; null nếu không rõ nền tảng. */
function getPlatformIcon(platform: string | null | undefined): LucideIcon | null {
  if (!platform) return null;
  const value = platform.trim();
  const key = [value, value.toLowerCase(), platformAliases[value.toLowerCase()]].find(
    (candidate) => candidate && candidate !== "other" && socialPlatforms[candidate],
  );
  return key ? socialPlatforms[key].icon : null;
}

function getPlatformColor(platform: string | null | undefined): string {
  if (!platform) {
    return platformColors.other;
  }

  const value = platform.trim();

  return (
    platformColors[value] ??
    platformColors[value.toLowerCase()] ??
    platformColors.other
  );
}

function formatAction(action: LinkDto["actions"][number]): string {
  return action.label || actionLabels[action.action] || action.action;
}

function formatPlatform(platform: string): string {
  return platform
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getYouTubeEmbedUrl(
  value: string | null | undefined,
  muted = true,
): string {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");

    let videoId = "";

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com"
    ) {
      if (
        url.pathname.startsWith("/shorts/") ||
        url.pathname.startsWith("/embed/")
      ) {
        videoId =
          url.pathname.split("/").filter(Boolean)[1] || "";
      } else {
        videoId = url.searchParams.get("v") || "";
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return "";
    }

    const params = new URLSearchParams({
      autoplay: "1",
      mute: muted ? "1" : "0",
      controls: "0",
      loop: "1",
      playlist: videoId,
      playsinline: "1",
      modestbranding: "1",
      rel: "0",
      enablejsapi: "1",
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  } catch {
    return "";
  }
}

export function PublicLinkUnlock({
  link,
}: {
  link: LinkDto;
}) {
  const t = useTranslations("PublicLink");
  const createT = useTranslations("CreateLink");
  // Tiêu đề để trống khi tạo link: dùng cùng chữ mặc định như bản xem trước.
  const displayTitle = link.title?.trim() || createT("unlockLink");
  const storageKey = `site:unlock:${link.slug}`;

  const countdownIntervalIdsRef = useRef<
    Map<string, number>
  >(new Map());

  const completionTimeoutIdsRef = useRef<
    Map<string, number>
  >(new Map());

  const youtubeBackgroundRef =
    useRef<HTMLIFrameElement | null>(null);
  const visitCompletedRef = useRef(false);
  const popunderOpenedRef = useRef(false);
  const adBlockDetectedRef = useRef(false);
  const deviceIdRef = useRef("");

  const [completedIds, setCompletedIds] = useState<
    string[]
  >([]);

  const [actionClickHistory, setActionClickHistory] =
    useState<MonetizationActionHistory>({});
  const [cooldownNow, setCooldownNow] = useState(0);
  const actionClickHistoryRef = useRef<MonetizationActionHistory>({});

  const [loadingIds, setLoadingIds] = useState<
    string[]
  >([]);

  const [
    remainingSecondsById,
    setRemainingSecondsById,
  ] = useState<Record<string, number>>({});

  const [snippetRevealed, setSnippetRevealed] =
    useState(false);

  const [youtubeMuted, setYoutubeMuted] =
    useState(true);

  const [currentPage, setCurrentPage] = useState(0);

  const requestedPageCount = Math.max(
    1,
    Math.min(20, link.showConfig?.pageCount ?? 1),
  );

  const eligibleActions = useMemo(
    () =>
      visibleActionsAfterCooldown(
        link.actions,
        actionClickHistory,
        link.slug,
        cooldownNow,
      ),
    [actionClickHistory, cooldownNow, link.actions, link.slug],
  );

  const actionPages = useMemo(
    () => splitActions(eligibleActions, requestedPageCount),
    [eligibleActions, requestedPageCount],
  );

  const injectedAds = useMemo(
    () =>
      (link.monetizationAds ?? []).filter(
        (ad) => ad.format === "inject_html",
      ),
    [link.monetizationAds],
  );

  const injectedAdsAt = (placement: string) =>
    injectedAds.filter((ad) => ad.placement === placement);

  const popunderUrl = useMemo(
    () =>
      (link.monetizationAds ?? []).find(
        (ad) =>
          ad.format === "smartlink" &&
          ad.placement === "popunder" &&
          ad.content.targetUrl,
      )?.content.targetUrl,
    [link.monetizationAds],
  );

  useEffect(() => {
    if (!popunderUrl) return;

    const openPopunder = () => {
      if (popunderOpenedRef.current) return;
      popunderOpenedRef.current = true;
      window.open(popunderUrl, "_blank", "noopener,noreferrer");
    };

    document.addEventListener("click", openPopunder, { capture: true, once: true });
    return () => document.removeEventListener("click", openPopunder, true);
  }, [popunderUrl]);

  const visibleActions = useMemo(
    () => actionPages[currentPage] ?? actionPages[0] ?? [],
    [actionPages, currentPage],
  );
  const isFinalPage = currentPage >= actionPages.length - 1;

  const actionIds = useMemo(
    () =>
      link.actions.map(
        (action, index) => action.id || `${index}`,
      ),
    [link.actions],
  );

  const validActionIdSet = useMemo(
    () => new Set(actionIds),
    [actionIds],
  );

  const monetizationActionIdSet = useMemo(
    () =>
      new Set(
        link.actions
          .filter((action) => Boolean(action.monetization))
          .map((action, index) => action.id || `${index}`),
      ),
    [link.actions],
  );

  const currentActionIds = useMemo(
    () =>
      visibleActions.map((action) => {
        const originalIndex = link.actions.indexOf(action);
        return action.id || String(Math.max(0, originalIndex));
      }),
    [link.actions, visibleActions],
  );

  const completedIdSet = useMemo(
    () => new Set(completedIds),
    [completedIds],
  );

  const loadingIdSet = useMemo(
    () => new Set(loadingIds),
    [loadingIds],
  );

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      try {
        const stored =
          window.localStorage.getItem(storageKey);

        const parsed: unknown = stored
          ? JSON.parse(stored)
          : [];

        if (!Array.isArray(parsed)) {
          setCompletedIds([]);
          return;
        }

        const validStoredIds = parsed.filter(
          (value): value is string =>
            typeof value === "string" &&
            validActionIdSet.has(value) &&
            !monetizationActionIdSet.has(value),
        );

        setCompletedIds(validStoredIds);
      } catch {
        setCompletedIds([]);
      }
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [monetizationActionIdSet, storageKey, validActionIdSet]);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      let history: MonetizationActionHistory = {};
      try {
        const stored = window.localStorage.getItem(
          MONETIZATION_ACTION_HISTORY_KEY,
        );
        const parsed: unknown = stored ? JSON.parse(stored) : {};
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          history = Object.fromEntries(
            Object.entries(parsed).filter(
              (entry): entry is [string, number] =>
                Number.isSafeInteger(entry[1]) && Number(entry[1]) > 0,
            ),
          );
        }
      } catch {
        history = {};
      }
      actionClickHistoryRef.current = history;
      setActionClickHistory(history);
      setCooldownNow(Date.now());
    }, 0);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    if (cooldownNow <= 0) return;
    const expiry = nextMonetizationCooldownExpiry(
      link.actions,
      actionClickHistory,
      link.slug,
      cooldownNow,
    );
    if (expiry === null) return;
    const delay = Math.min(
      Math.max(expiry - Date.now() + 50, 50),
      2_147_000_000,
    );
    const timerId = window.setTimeout(() => setCooldownNow(Date.now()), delay);
    return () => window.clearTimeout(timerId);
  }, [actionClickHistory, cooldownNow, link.actions, link.slug]);

  useEffect(() => {
    const countdownIntervalIds =
      countdownIntervalIdsRef.current;

    const completionTimeoutIds =
      completionTimeoutIdsRef.current;

    return () => {
      countdownIntervalIds.forEach((intervalId) => {
        window.clearInterval(intervalId);
      });

      completionTimeoutIds.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });

      countdownIntervalIds.clear();
      completionTimeoutIds.clear();
    };
  }, []);

  const completedCount = useMemo(
    () =>
      currentActionIds.reduce(
        (total, id) =>
          completedIdSet.has(id)
            ? total + 1
            : total,
        0,
      ),
    [currentActionIds, completedIdSet],
  );

  const totalActions = currentActionIds.length;

  const unlocked =
    totalActions === 0 ||
    completedCount === totalActions;

  const progress =
    totalActions > 0
      ? (completedCount / totalActions) * 100
      : 100;

  useEffect(() => {
    deviceIdRef.current = getOrCreateDeviceId();
    void detectAdBlock().then((blocked) => {
      adBlockDetectedRef.current = blocked;
    });
  }, []);

  const completeSuccessfulVisit = () => {
    if (visitCompletedRef.current || !link.visitToken) return;
    visitCompletedRef.current = true;
    void completePublicLinkVisit(link.slug, link.visitToken, {
      deviceId: deviceIdRef.current || undefined,
      adBlockDetected: adBlockDetectedRef.current,
    }).catch(() => {
      visitCompletedRef.current = false;
    });
  };

  const selectedBackground = useMemo(
    () =>
      backgroundImages.find(
        (background) =>
          background.id ===
          link.backgroundSettings
            .selectedBackgroundId,
      ),
    [
      link.backgroundSettings
        .selectedBackgroundId,
    ],
  );

  const backgroundMediaType =
    link.backgroundSettings.sameAsCoverImage
      ? "image"
      : link.backgroundSettings
        .backgroundMediaType;

  const backgroundMediaUrl =
    link.backgroundSettings.sameAsCoverImage
      ? link.coverImageUrl ||
      selectedBackground?.imageUrl ||
      null
      : link.backgroundSettings
        .backgroundMediaUrl ||
      selectedBackground?.imageUrl ||
      null;

  const backgroundImageUrl =
    backgroundMediaType === "image"
      ? backgroundMediaUrl
      : null;

  const desktopBackgroundImageUrl =
    backgroundImageUrl &&
      !link.backgroundSettings.sameAsCoverImage &&
      selectedBackground?.desktopImageUrl
      ? selectedBackground.desktopImageUrl
      : backgroundImageUrl;

  const backgroundVideoUrl =
    backgroundMediaType === "video"
      ? backgroundMediaUrl
      : null;

  // Luôn nhúng ở chế độ tắt tiếng và giữ src cố định: nếu src đổi theo trạng
  // loa, iframe sẽ tải lại với mute=0 và trình duyệt chặn tự phát có tiếng nên
  // video đứng im. Bật/tắt tiếng chỉ qua postMessage (toggleYouTubeAudio).
  const backgroundYouTubeUrl =
    backgroundMediaType === "youtube"
      ? getYouTubeEmbedUrl(backgroundMediaUrl, true)
      : "";

  const backgroundEffects = link.backgroundSettings.effects;
  const backgroundFilter = [
    `opacity(${backgroundEffects.opacity / 100})`,
    `blur(${backgroundEffects.blur}px)`,
    `saturate(${backgroundEffects.saturation / 100})`,
    `contrast(${backgroundEffects.contrast / 100})`,
    `grayscale(${backgroundEffects.grayscale / 100})`,
  ].join(" ");

  const toggleYouTubeAudio = () => {
    const nextMuted = !youtubeMuted;

    setYoutubeMuted(nextMuted);

    const iframeWindow =
      youtubeBackgroundRef.current?.contentWindow;

    iframeWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: nextMuted ? "mute" : "unMute",
        args: [],
      }),
      "https://www.youtube.com",
    );

    if (!nextMuted) {
      iframeWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "https://www.youtube.com",
      );
    }
  };

  const markCompleted = (id: string) => {
    setCompletedIds((current) => {
      if (current.includes(id)) {
        return current;
      }

      const next = [...current, id];

      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify(
            next.filter((actionId) => !monetizationActionIdSet.has(actionId)),
          ),
        );
      } catch {
        // Không chặn UI nếu localStorage bị vô hiệu hóa.
      }

      return next;
    });
  };

  const clearActionTimers = (id: string) => {
    const intervalId =
      countdownIntervalIdsRef.current.get(id);

    const timeoutId =
      completionTimeoutIdsRef.current.get(id);

    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      countdownIntervalIdsRef.current.delete(id);
    }

    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      completionTimeoutIdsRef.current.delete(id);
    }
  };

  const finishAction = (id: string) => {
    clearActionTimers(id);
    markCompleted(id);

    setLoadingIds((current) =>
      current.filter(
        (loadingId) => loadingId !== id,
      ),
    );

    setRemainingSecondsById((current) => {
      const next = { ...current };

      delete next[id];

      return next;
    });
  };

  const handleActionClick = (id: string, clickedAt: number) => {
    if (
      completedIdSet.has(id) ||
      loadingIdSet.has(id)
    ) {
      return;
    }

    const action = link.actions.find((item, index) =>
      (item.id || String(index)) === id,
    );
    if (action?.monetization) {
      const nextHistory = recordMonetizationActionClick(
        actionClickHistoryRef.current,
        action,
        link.slug,
        clickedAt,
      );
      actionClickHistoryRef.current = nextHistory;
      try {
        window.localStorage.setItem(
          MONETIZATION_ACTION_HISTORY_KEY,
          JSON.stringify(nextHistory),
        );
      } catch {
        // Không chặn action nếu browser không cho ghi localStorage.
      }
    }

    setLoadingIds((current) =>
      current.includes(id)
        ? current
        : [...current, id],
    );

    setRemainingSecondsById((current) => ({
      ...current,
      [id]: ACTION_DELAY_SECONDS,
    }));

    const countdownIntervalId =
      window.setInterval(() => {
        setRemainingSecondsById((current) => {
          const nextSeconds = Math.max(
            (current[id] ?? ACTION_DELAY_SECONDS) - 1,
            0,
          );

          return {
            ...current,
            [id]: nextSeconds,
          };
        });
      }, 1000);

    countdownIntervalIdsRef.current.set(
      id,
      countdownIntervalId,
    );

    const completionTimeoutId = window.setTimeout(() => {
      finishAction(id);
    }, ACTION_DELAY_SECONDS * 1000);

    completionTimeoutIdsRef.current.set(id, completionTimeoutId);
  };

  return (
    <PublicCreatorLayout
      variant="linear"
      className="items-start"
      background={
        backgroundImageUrl || backgroundVideoUrl || backgroundYouTubeUrl ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
            {backgroundImageUrl ? (
              <>
                <div
                  className="absolute inset-0 scale-105 bg-cover bg-center sm:hidden"
                  style={{ backgroundImage: "url(" + backgroundImageUrl + ")", filter: backgroundFilter }}
                />
                <div
                  className="absolute inset-0 hidden scale-105 bg-cover bg-center sm:block"
                  style={{ backgroundImage: "url(" + desktopBackgroundImageUrl + ")", filter: backgroundFilter }}
                />
              </>
            ) : backgroundVideoUrl ? (
              <video
                src={backgroundVideoUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 size-full scale-[1.03] object-cover"
                style={{ filter: backgroundFilter }}
              />
            ) : backgroundYouTubeUrl ? (
              <iframe
                ref={youtubeBackgroundRef}
                src={backgroundYouTubeUrl}
                title={t("backgroundVideo")}
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute left-1/2 top-1/2 h-[150%] w-[267%] -translate-x-1/2 -translate-y-1/2 sm:h-[135%] sm:w-[240%]"
                style={{ filter: backgroundFilter }}
              />
            ) : null}
          </div>
        ) : null
      }
      topAction={
        backgroundYouTubeUrl ? (
          <button
            type="button"
            onClick={toggleYouTubeAudio}
            aria-label={youtubeMuted ? t("enableAudio") : t("muteAudio")}
            title={youtubeMuted ? t("enableAudio") : t("muteAudio")}
            className="grid size-10 place-items-center rounded-lg border border-slate-200 bg-white/90 text-slate-600 backdrop-blur-xl transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-[#0f1011]/90 dark:text-[#d0d6e0] dark:hover:bg-[#18191a] dark:hover:text-white"
          >
            {youtubeMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        ) : undefined
      }
    >
      {injectedAdsAt("safe_overlay_top").map((ad) => (
        <div
          key={`${ad.id}-${ad.placement}`}
          className="fixed inset-x-0 top-0 z-50 mx-auto w-full max-w-[680px] overflow-hidden bg-white/95 shadow-xl backdrop-blur dark:bg-[#0f1011]/95"
        >
          <InjectedHtmlAd ad={ad} />
        </div>
      ))}

      {injectedAdsAt("safe_overlay_bottom").map((ad) => (
        <div
          key={`${ad.id}-${ad.placement}`}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-[680px] overflow-hidden bg-white/95 shadow-xl backdrop-blur dark:bg-[#0f1011]/95"
        >
          <InjectedHtmlAd ad={ad} />
        </div>
      ))}

      <div
        className="mx-auto w-full max-w-[680px]"
        data-testid="public-link-shell"
      >
        {injectedAdsAt("stu_before").map((ad) => (
          <div
            key={`${ad.id}-${ad.placement}`}
            className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1011]/95 dark:shadow-none"
          >
            <InjectedHtmlAd ad={ad} />
          </div>
        ))}

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1011]/95 dark:shadow-none sm:p-6">
          {/* Image */}
          {link.coverImageUrl ? (
            <img
              src={link.coverImageUrl}
              alt={displayTitle}
              className="aspect-video w-full rounded-lg object-cover"
            />
          ) : null}

          {/* Title */}
          <div
            className={cn(
              "mx-auto text-center",
              link.coverImageUrl && "mt-6",
            )}
          >
            <h1 className="text-balance text-xl font-semibold leading-tight tracking-[-0.03em] text-slate-950 dark:text-[#f7f8f8] sm:text-2xl">
              {displayTitle}
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 dark:text-[#8a8f98]">
              {link.subtitle || t("defaultDescription")}
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-2.5">
            {visibleActions.map((action) => {
              const originalIndex = link.actions.indexOf(action);
              const id = action.id || String(Math.max(0, originalIndex));
              const completed = completedIdSet.has(id);
              const loading = loadingIdSet.has(id);

              // Ưu tiên logo nền tảng; hành động không thuộc nền tảng nào (quảng cáo, ghé web) dùng icon hành động.
              const ActionIcon =
                getPlatformIcon(action.platform) ??
                getMonetizationActionIcon(action.icon) ??
                getActionIcon(action.action);
              const platformColor = getPlatformColor(action.platform);

              const remainingSeconds =
                remainingSecondsById[id] ?? ACTION_DELAY_SECONDS;

              const countdownProgress =
                ((ACTION_DELAY_SECONDS - remainingSeconds) /
                  ACTION_DELAY_SECONDS) *
                100;

              const actionLabel = action.label || (createT.has(
                `actionLabels.${action.action}`,
              )
                ? createT(`actionLabels.${action.action}`)
                : formatAction(action));

              return (
                <a
                  key={id}
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-busy={loading}
                  aria-disabled={loading || undefined}
                  data-testid={`public-action-${Math.max(0, originalIndex)}`}
                  onClick={(event) => {
                    if (loading) {
                      event.preventDefault();
                      return;
                    }

                    handleActionClick(id, Date.now());
                  }}
                  className={[
                    "group relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-md px-2.5 py-2 text-left text-white",
                    "shadow-[inset_0_-3px_0_rgba(0,0,0,0.18)] transition-[filter,transform] duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-400 dark:focus-visible:ring-offset-[#0f1011]",
                    completed
                      ? "bg-[#27a644]"
                      : loading
                        ? `cursor-wait ${platformColor}`
                        : `${platformColor} hover:brightness-110 active:translate-y-px`,
                  ].join(" ")}
                >
                  {loading ? (
                    <span className="absolute inset-x-0 bottom-0 h-1 bg-black/20">
                      <span
                        className="block h-full bg-white/80 transition-[width] duration-1000 ease-linear"
                        style={{
                          width: `${Math.min(
                            Math.max(countdownProgress, 0),
                            100,
                          )}%`,
                        }}
                      />
                    </span>
                  ) : null}

                  <span className="relative grid size-10 shrink-0 place-items-center">
                    {completed ? <Check className="size-5" /> : <ActionIcon className="size-6" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold leading-5 text-center">
                      {loading ? t("pleaseWait") : actionLabel + " " + formatPlatform(action.platform)}
                    </span>
                  </span>

                  <span className="grid size-8 shrink-0 place-items-center rounded bg-white/15">
                    {loading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : completed ? (
                      <Check className="size-4" />
                    ) : (
                      <ChevronsRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-950 dark:text-[#f7f8f8]">
                  {unlocked ? t("readyTitle") : t("progressTitle")}
                </p>
                {actionPages.length > 1 ? (
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#8a8f98]">
                    Page {currentPage + 1}/{actionPages.length}
                  </p>
                ) : null}
              </div>

              <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-[#8a8f98]">
                  {completedCount }/{totalActions}
                </p>
            </div>

            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-[#23252a]"
              data-testid="unlock-progress"
            >
              <div
                className={[
                  "h-full rounded-full transition-[width] duration-500",
                  unlocked ? "bg-[#27a644]" : "bg-[#5e6ad2]",
                ].join(" ")}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Destination */}
          <div className="mt-6">
            {!isFinalPage ? (
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => {
                  if (!unlocked) return;
                  setCurrentPage((page) => Math.min(page + 1, actionPages.length - 1));
                }}
                data-testid="unlock-cta"
                className={[
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                  unlocked
                    ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                    : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                ].join(" ")}
              >
                {unlocked ? (
                  <ChevronsRight className="size-4" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}
                {unlocked
                  ? `Tiếp tục Page ${currentPage + 2}`
                  : "Hoàn thành action của page này"}
              </button>
            ) : link.inputType === "snippet" ? (
              <>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    setSnippetRevealed(true);
                    completeSuccessfulVisit();
                  }}
                  data-testid="unlock-cta"
                  className={[
                    "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                    unlocked
                      ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                      : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                  ].join(" ")}
                >
                  {unlocked ? (
                    <FileText className="size-4" />
                  ) : (
                    <LockKeyhole className="size-4" />
                  )}

                  {unlocked
                    ? snippetRevealed
                      ? t("snippetRevealed")
                      : t("revealSnippet")
                    : t("unlockSnippet")}
                </button>

                {snippetRevealed && unlocked && link.destinationDeleted ? (
                  <DestinationDeletedNotice title={t("snippetDeletedTitle")} description={t("snippetDeletedDescription")} />
                ) : snippetRevealed && unlocked ? (
                  <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 dark:border-white/10 dark:bg-[#010102] dark:text-[#d0d6e0]">
                    {link.destinationUrl}
                  </pre>
                ) : null}
              </>
            ) : link.destinationDeleted ? (
              <>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    setSnippetRevealed(true);
                    completeSuccessfulVisit();
                  }}
                  data-testid="unlock-cta"
                  className={[
                    "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                    unlocked
                      ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                      : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                  ].join(" ")}
                >
                  {unlocked ? <ExternalLink className="size-4" /> : <LockKeyhole className="size-4" />}
                  {unlocked ? t("openFile") : t("unlockLink")}
                </button>
                {snippetRevealed && unlocked ? (
                  <DestinationDeletedNotice title={t("snippetDeletedTitle")} description={t("snippetDeletedDescription")} />
                ) : null}
              </>
            ) : (
              <a
                href={unlocked ? link.destinationUrl : undefined}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!unlocked}
                data-testid="unlock-cta"
                onClick={completeSuccessfulVisit}
                className={[
                  "flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
                  unlocked
                    ? "bg-[#5e6ad2] text-white hover:bg-[#828fff]"
                    : "pointer-events-none cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-[#18191a] dark:text-[#62666d]",
                ].join(" ")}
              >
                {unlocked ? (
                  <ExternalLink className="size-4" />
                ) : (
                  <LockKeyhole className="size-4" />
                )}

                {unlocked
                  ? link.inputType === "file"
                    ? t("openFile")
                    : t("continueToLink")
                  : t("unlockLink")}
              </a>
            )}
          </div>
        </section>

        {injectedAdsAt("stu_after").map((ad) => (
          <div
            key={`${ad.id}-${ad.placement}`}
            className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#0f1011]/95 dark:shadow-none"
          >
            <InjectedHtmlAd ad={ad} />
          </div>
        ))}

        <div className="mt-4 flex flex-wrap items-center justify-center gap-1 text-xs">
          <Link
            href="/member/create"
            className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-950 dark:text-[#8a8f98] dark:hover:bg-white/5 dark:hover:text-[#d0d6e0]"
          >
            {t("createOwn")}
          </Link>
          <span aria-hidden="true" className="text-slate-300 dark:text-white/15">
            ·
          </span>
          <Link
            href={`/report-link?url=${encodeURIComponent(link.shortUrl)}`}
            className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-black/5 hover:text-slate-950 dark:text-[#8a8f98] dark:hover:bg-white/5 dark:hover:text-[#d0d6e0]"
          >
            {t("reportLink")}
          </Link>
        </div>
      </div>
    </PublicCreatorLayout>
  );
}

function DestinationDeletedNotice({ title, description }: { title: string; description: string }) {
  return (
    <div
      role="alert"
      className="mt-3 flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-400/20 dark:bg-amber-400/5"
    >
      <FileX className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
      <div>
        <p className="font-medium text-slate-900 dark:text-[#f7f8f8]">{title}</p>
        <p className="mt-1 leading-6 text-slate-600 dark:text-[#8a8f98]">{description}</p>
      </div>
    </div>
  );
}
