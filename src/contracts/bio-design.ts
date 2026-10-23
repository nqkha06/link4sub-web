export const BIO_DESIGN_SCHEMA_VERSION = 1 as const;

/**
 * Hiệu ứng nền. Nhóm đầu là hiệu ứng gốc (kiểu guns.lol); nhóm sau mô phỏng
 * bộ hiệu ứng của zyo.lol (tự viết lại bằng CSS / canvas / WebGL).
 */
export const bioBackgroundEffectTypes = [
  "none", "dither", "plasma", "aurora", "snowflakes", "rain", "blurred", "night-time", "old-tv",
  "wave", "star-drop", "noise", "dots",
  "chroma-waves", "luminous-flow", "aurora-silk", "velvet-waves", "nebula-drift", "soft-horizon",
  "liquid-flow", "spectrum-warp", "aurora-lines", "chromatic-pulse", "glitter-warp", "light-droplets",
  "lightspeed", "liquid-lines", "metallic-swirl", "topography", "gradient-waves",
] as const;
export type BioBackgroundEffectType = (typeof bioBackgroundEffectTypes)[number];

/** Hiệu ứng theo con trỏ (kiểu "Cursor Effects" của guns.lol). */
export const bioCursorTrailTypes = [
  "none", "shooting-star", "fairy-dust", "sparkles", "bubbles", "snowflakes", "rainbow", "dots", "ghost",
] as const;
export type BioCursorTrailType = (typeof bioCursorTrailTypes)[number];

/** Font của trang bio (thứ tự = thứ tự trong ô chọn font, giống guns.lol). */
export const bioDesignFontFamilies = [
  "Poppins",
  "JetBrains Mono",
  "Satoshi",
  "Outfit",
  "Chillax",
  "Starborn",
  "Drippy",
  "Vampiro",
  "Pixelify",
  "Array",
  "Minecraft",
  "MetalGothic",
  "Sakura",
  "Mansalva",
  "UnifrakturMaguntia",
  "Inter",
  "Manrope",
  "Space Grotesk",
  "Orbitron",
] as const;

export type BioDesignFontFamily = (typeof bioDesignFontFamilies)[number];

/** Hiệu ứng cho tên hiển thị (username) trên trang bio công khai. */
export const bioUsernameEffects = [
  "none",
  "rainbow",
  "typewriter",
  "shine",
  "glitch",
  "shimmer",
  "neon",
  "wave",
  "scramble",
  "scramble-2",
  "lightning",
  "glitch-2",
  "stars",
  "distort",
  "fuzzy",
  "pulse",
  "sparkles-black",
  "sparkles-blue",
  "sparkles-green",
  "sparkles-pink",
  "sparkles-red",
  "sparkles-white",
  "sparkles-yellow",
] as const;

export type BioUsernameEffect = (typeof bioUsernameEffects)[number];
export type BioHorizontalAlign = "left" | "center" | "right";

export interface BioMusicTrack {
  id: string;
  assetId: string;
  title: string;
}

export interface BioDesign {
  schemaVersion: typeof BIO_DESIGN_SCHEMA_VERSION;
  profile: {
    layoutMode: "classic" | "modern" | "compact";
    horizontalAlign: BioHorizontalAlign;
    verticalAlign: "top" | "center" | "bottom";
    maxWidth: number;
    minHeight: number | null;
    padding: number;
    contentGap: number;
    profileScale: number;
    mobileMaxWidth: number;
    mobilePadding: number;
    card: {
      enabled: boolean;
      backgroundColor: string;
      backgroundOpacity: number;
      backdropBlur: number;
      borderRadius: number;
      borderEnabled: boolean;
      borderWidth: number;
      borderColor: string;
      borderOpacity: number;
      borderStyle: "solid" | "dashed" | "dotted";
      gradientEnabled: boolean;
      gradientFrom: string;
      gradientTo: string;
      gradientAngle: number;
      shadowEnabled: boolean;
      shadowColor: string;
      shadowBlur: number;
      shadowSpread: number;
    };
    avatar: {
      size: number;
      shape: "circle" | "rounded" | "square";
      radius: number;
      borderEnabled: boolean;
      borderColor: string;
      borderWidth: number;
      glowEnabled: boolean;
      glowColor: string;
      glowIntensity: number;
      objectFit: "cover" | "contain";
      decorationEnabled: boolean;
    };
    display: {
      showAvatar: boolean;
      showDescription: boolean;
      showLocation: boolean;
      showBadges: boolean;
      showJoinDate: boolean;
      showViewCount: boolean;
      usernameAlignment: BioHorizontalAlign;
      descriptionAlignment: BioHorizontalAlign;
      profileHeaderGap: number;
      badgePosition: "after-username" | "separate-row";
    };
  };
  background: {
    type: "color" | "gradient" | "image" | "video";
    color: string;
    gradientFrom: string;
    gradientTo: string;
    gradientAngle: number;
    imageAssetId: string | null;
    videoAssetId: string | null;
    fallbackImageAssetId: string | null;
    mobileAssetId: string | null;
    fit: "cover" | "contain" | "fill";
    positionX: number;
    positionY: number;
    scale: number;
    repeat: "no-repeat" | "repeat";
    fixed: boolean;
    overlay: {
      enabled: boolean;
      color: string;
      opacity: number;
      gradientEnabled: boolean;
      gradientFrom: string;
      gradientTo: string;
      gradientAngle: number;
    };
    filter: {
      blur: number;
      brightness: number;
      contrast: number;
      saturation: number;
      grayscale: number;
      hueRotate: number;
      sepia: number;
    };
    video: {
      loop: boolean;
      muted: boolean;
      playbackRate: number;
      pauseWhenHidden: boolean;
      mobileMode: "video" | "static-image" | "off";
      posterAssetId: string | null;
      preload: "none" | "metadata" | "auto";
    };
  };
  appearance: {
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      text: string;
      textMuted: string;
      icon: string;
      link: string;
      border: string;
      surface: string;
      success: string;
    };
    font: {
      family: BioDesignFontFamily;
      usernameFamily: BioDesignFontFamily;
      usernameSize: number;
      usernameWeight: number;
      usernameLetterSpacing: number;
      descriptionSize: number;
      bodySize: number;
      bodyWeight: number;
      lineHeight: number;
      textTransform: "none" | "uppercase" | "lowercase";
      usernameShadowEnabled: boolean;
      usernameShadowColor: string;
      usernameShadowBlur: number;
    };
    links: {
      variant: "card" | "button" | "outline" | "minimal" | "glass";
      radius: number;
      backgroundColor: string;
      textColor: string;
      borderColor: string;
      borderWidth: number;
      paddingX: number;
      paddingY: number;
      gap: number;
      iconSize: number;
      iconPosition: "left" | "right";
      iconColor: string;
      hoverEffect: "none" | "lift" | "glow" | "scale";
      shadow: boolean;
      alignment: BioHorizontalAlign;
      fullWidth: boolean;
    };
    collections: {
      variant: "grid" | "list" | "cards" | "carousel";
      columns: number;
      mobileColumns: number;
      gap: number;
      imageRatio: "1:1" | "4:3" | "16:9";
      imageRadius: number;
      cardBackground: string;
      cardOpacity: number;
      borderEnabled: boolean;
      borderColor: string;
      titleSize: number;
      descriptionColor: string;
      hoverEffect: "none" | "zoom" | "lift" | "glow";
      showImage: boolean;
      showDescription: boolean;
    };
    blocks: {
      backgroundColor: string;
      backgroundOpacity: number;
      borderColor: string;
      borderRadius: number;
      padding: number;
      titleColor: string;
      textColor: string;
      shadow: boolean;
      hoverEffect: "none" | "lift" | "glow" | "scale";
    };
  };
  effects: {
    background: {
      type: BioBackgroundEffectType;
      color: string;
      opacity: number;
      intensity: number;
      speed: number;
      density: number;
      blendMode: "normal" | "screen" | "overlay" | "soft-light";
      mobileEnabled: boolean;
    };
    profile: {
      type: "none" | "fade" | "slide-up" | "zoom" | "unfold" | "bounce";
      duration: number;
      delay: number;
      easing: "ease" | "ease-out" | "spring";
      hoverEffect: "none" | "lift" | "scale" | "glow";
      parallaxEnabled: boolean;
      parallaxIntensity: number;
      floatEnabled: boolean;
    };
    username: {
      type: BioUsernameEffect;
      speed: number;
      loop: boolean;
      glowEnabled: boolean;
      glowColor: string;
      glowBlur: number;
      glowIntensity: number;
      gradientEnabled: boolean;
      gradientFrom: string;
      gradientTo: string;
      gradientAngle: number;
    };
    social: {
      hoverEffect: "none" | "scale" | "lift" | "glow";
      hoverDuration: number;
      glowEnabled: boolean;
      glowColor: string;
      glowIntensity: number;
    };
    badges: {
      glowEnabled: boolean;
      glowColor: string;
      animation: "none" | "pulse" | "float";
    };
    cursor: {
      type: "default" | "custom";
      assetId: string | null;
      width: number;
      height: number;
      hotspotX: number;
      hotspotY: number;
      trailEnabled: boolean;
      trailType: BioCursorTrailType;
      trailColor: string;
      trailLength: number;
      clickEffect: "none" | "ripple" | "particles";
    };
    enter: {
      enabled: boolean;
      title: string;
      subtitle: string;
      buttonText: string;
      backgroundType: "color" | "image" | "blur";
      backgroundColor: string;
      backgroundAssetId: string | null;
      textColor: string;
      animation: "fade" | "zoom" | "slide";
      duration: number;
      startAudioOnClick: boolean;
      showOncePerSession: boolean;
    };
  };
  audio: {
    music: {
      enabled: boolean;
      assetId: string | null;
      title: string;
      artist: string;
      coverAssetId: string | null;
      volume: number;
      loop: boolean;
      startMode: "manual" | "on-enter";
      fadeIn: number;
      fadeOut: number;
      pauseWhenHidden: boolean;
      /**
       * Danh sách nhạc (tối đa BIO_MUSIC_MAX_TRACKS). `assetId`/`title` ở trên là
       * bài đang "Active"; trang cũ chỉ có bài đó và chưa có danh sách.
       */
      tracks: BioMusicTrack[];
      /** Mỗi lượt xem phát ngẫu nhiên một bài trong danh sách. */
      shuffle: boolean;
    };
    player: {
      visible: boolean;
      style: "minimal" | "floating" | "compact";
      position: "bottom-left" | "bottom-right" | "inside-card";
      showTitle: boolean;
      showCover: boolean;
      showProgress: boolean;
      showVolume: boolean;
      showMute: boolean;
      accentColor: string;
      backgroundColor: string;
      opacity: number;
      borderRadius: number;
    };
    sounds: {
      enabled: boolean;
      clickAssetId: string | null;
      hoverAssetId: string | null;
      enterAssetId: string | null;
      volume: number;
      cooldownMs: number;
    };
  };
}

/**
 * Mặc định theo phong cách "glass card" (thẻ kính mờ giữa màn hình, viền trắng
 * dày, chữ trắng phát sáng, icon mạng xã hội phát sáng, nút trong mờ).
 */
export const DEFAULT_BIO_DESIGN: BioDesign = {
  schemaVersion: BIO_DESIGN_SCHEMA_VERSION,
  profile: {
    layoutMode: "modern", horizontalAlign: "center", verticalAlign: "center",
    maxWidth: 704, minHeight: null, padding: 26, contentGap: 15, profileScale: 100,
    mobileMaxWidth: 520, mobilePadding: 15,
    card: {
      enabled: true, backgroundColor: "#FFFFFF", backgroundOpacity: 3,
      backdropBlur: 10, borderRadius: 15, borderEnabled: true, borderWidth: 5,
      borderColor: "#FFFFFF", borderOpacity: 30, borderStyle: "solid",
      gradientEnabled: false, gradientFrom: "#FFFFFF08", gradientTo: "#63636308",
      gradientAngle: 25, shadowEnabled: false, shadowColor: "#000000",
      shadowBlur: 48, shadowSpread: 0,
    },
    avatar: {
      size: 100, shape: "circle", radius: 24, borderEnabled: true,
      borderColor: "#FFFFFF4D", borderWidth: 2, glowEnabled: false,
      glowColor: "#FFFFFF", glowIntensity: 35, objectFit: "cover",
      decorationEnabled: false,
    },
    display: {
      showAvatar: true, showDescription: true, showLocation: false,
      showBadges: true, showJoinDate: true, showViewCount: true,
      usernameAlignment: "left", descriptionAlignment: "left",
      profileHeaderGap: 14, badgePosition: "after-username",
    },
  },
  background: {
    type: "color", color: "#0B0B10", gradientFrom: "#0B0B10",
    gradientTo: "#1E293B", gradientAngle: 145, imageAssetId: null,
    videoAssetId: null, fallbackImageAssetId: null, mobileAssetId: null,
    fit: "cover", positionX: 50, positionY: 50, scale: 100,
    repeat: "no-repeat", fixed: false,
    overlay: {
      enabled: false, color: "#000000", opacity: 20, gradientEnabled: false,
      gradientFrom: "#000000", gradientTo: "#111827", gradientAngle: 180,
    },
    filter: { blur: 0, brightness: 100, contrast: 100, saturation: 100, grayscale: 0, hueRotate: 0, sepia: 0 },
    video: { loop: true, muted: true, playbackRate: 1, pauseWhenHidden: true, mobileMode: "video", posterAssetId: null, preload: "metadata" },
  },
  appearance: {
    colors: {
      primary: "#FFFFFF", secondary: "#A1A1AA", accent: "#FFFFFF",
      text: "#FFFFFF", textMuted: "#FFFFFF80", icon: "#FFFFFF",
      link: "#FFFFFFA6", border: "#FFFFFF1A", surface: "#FFFFFF33",
      success: "#43B581",
    },
    font: {
      family: "Chillax", usernameFamily: "Chillax", usernameSize: 36,
      usernameWeight: 600, usernameLetterSpacing: 0, descriptionSize: 15,
      bodySize: 15, bodyWeight: 400, lineHeight: 1.45, textTransform: "none",
      usernameShadowEnabled: false, usernameShadowColor: "#000000",
      usernameShadowBlur: 12,
    },
    links: {
      variant: "glass", radius: 10, backgroundColor: "#FFFFFF38",
      textColor: "#FFFFFF", borderColor: "#FFFFFF1F", borderWidth: 2,
      paddingX: 16, paddingY: 12, gap: 15, iconSize: 20,
      iconPosition: "left", iconColor: "#FFFFFF", hoverEffect: "none",
      shadow: false, alignment: "center", fullWidth: true,
    },
    collections: {
      variant: "grid", columns: 2, mobileColumns: 2, gap: 12,
      imageRatio: "1:1", imageRadius: 15, cardBackground: "#FFFFFF33",
      cardOpacity: 100, borderEnabled: true, borderColor: "#FFFFFF1A",
      titleSize: 15, descriptionColor: "#FFFFFFA6", hoverEffect: "zoom",
      showImage: true, showDescription: true,
    },
    blocks: {
      backgroundColor: "#FFFFFF33", backgroundOpacity: 100,
      borderColor: "#FFFFFF1A", borderRadius: 25, padding: 14,
      titleColor: "#FFFFFF", textColor: "#FFFFFFB3", shadow: false,
      hoverEffect: "none",
    },
  },
  effects: {
    background: { type: "none", color: "#FFFFFF", opacity: 100, intensity: 50, speed: 1, density: 40, blendMode: "normal", mobileEnabled: true },
    profile: { type: "zoom", duration: 400, delay: 0, easing: "ease", hoverEffect: "none", parallaxEnabled: true, parallaxIntensity: 10, floatEnabled: false },
    username: { type: "none", speed: 1, loop: false, glowEnabled: true, glowColor: "#FFFFFF", glowBlur: 16, glowIntensity: 100, gradientEnabled: false, gradientFrom: "#FFFFFF", gradientTo: "#A1A1AA", gradientAngle: 90 },
    social: { hoverEffect: "scale", hoverDuration: 200, glowEnabled: true, glowColor: "#FFFFFF", glowIntensity: 70 },
    badges: { glowEnabled: true, glowColor: "#FFFFFF", animation: "none" },
    cursor: { type: "default", assetId: null, width: 32, height: 32, hotspotX: 16, hotspotY: 16, trailEnabled: false, trailType: "none", trailColor: "#FFFFFF", trailLength: 12, clickEffect: "none" },
    enter: { enabled: false, title: "click to enter...", subtitle: "", buttonText: "Enter", backgroundType: "blur", backgroundColor: "#000000", backgroundAssetId: null, textColor: "#FFFFFF", animation: "fade", duration: 450, startAudioOnClick: true, showOncePerSession: false },
  },
  audio: {
    music: { enabled: false, assetId: null, title: "", artist: "", coverAssetId: null, volume: 60, loop: true, startMode: "on-enter", fadeIn: 0, fadeOut: 0, pauseWhenHidden: true, tracks: [], shuffle: false },
    player: { visible: true, style: "minimal", position: "bottom-right", showTitle: true, showCover: true, showProgress: true, showVolume: false, showMute: true, accentColor: "#FFFFFF", backgroundColor: "#09090B", opacity: 88, borderRadius: 14 },
    sounds: { enabled: false, clickAssetId: null, hoverAssetId: null, enterAssetId: null, volume: 35, cooldownMs: 250 },
  },
};

/* -------------------------------------------------------------------------- */
/* Asset dựng sẵn (template)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Ngoài id file thư viện (chuỗi số), các trường *AssetId của Bio Design còn
 * nhận asset tĩnh đi kèm template: `builtin:templates/<template>/<file>`.
 * File nằm ở stu-web `public/assets/bio/templates/<template>/<file>`.
 */
export const BIO_BUILTIN_ASSET_PREFIX = "builtin:";
export const BIO_BUILTIN_ASSET_PATTERN = /^builtin:templates\/[a-z0-9-]{1,40}\/[a-z0-9_-]{1,60}\.[a-z0-9]{2,5}$/;

export function isBioBuiltinAssetId(id: unknown): id is string {
  return typeof id === "string" && BIO_BUILTIN_ASSET_PATTERN.test(id);
}

/** URL tương đối (phục vụ bởi web) của asset dựng sẵn; không phải asset dựng sẵn thì undefined. */
export function resolveBioBuiltinAssetUrl(id: unknown): string | undefined {
  return isBioBuiltinAssetId(id) ? `/assets/bio/${id.slice(BIO_BUILTIN_ASSET_PREFIX.length)}` : undefined;
}

/* -------------------------------------------------------------------------- */
/* Danh sách nhạc                                                             */
/* -------------------------------------------------------------------------- */

export const BIO_MUSIC_MAX_TRACKS = 4;
export const BIO_MUSIC_TITLE_MAX_LENGTH = 30;

/**
 * Danh sách nhạc hiệu lực: `tracks`, cộng thêm bài đang active nếu bài đó
 * chưa nằm trong danh sách (dữ liệu cũ / template chỉ đặt `assetId`).
 */
export function getBioMusicTracks(music: Pick<BioDesign["audio"]["music"], "assetId" | "title"> & { tracks?: BioMusicTrack[] }): BioMusicTrack[] {
  const tracks = (music.tracks ?? []).filter((track) => track && track.assetId);
  if (music.assetId && !tracks.some((track) => track.assetId === music.assetId)) {
    return [{ id: `active-${music.assetId}`, assetId: music.assetId, title: music.title }, ...tracks].slice(0, BIO_MUSIC_MAX_TRACKS);
  }
  return tracks.slice(0, BIO_MUSIC_MAX_TRACKS);
}
