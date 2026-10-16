import type { PublicationStatus } from "@/types/publication-status";
import type { RouteTargeting } from "@/contracts";
import type { MonetizationActionIconKey } from "@/contracts";

export type MonetizationLevelStatus = PublicationStatus;
export type MonetizationAdDensity = "none" | "limited" | "maximum";
export type MonetizationDeviceType = "any" | "desktop" | "mobile" | "tablet";
export type MonetizationRouteMatchMode = "include" | "exclude";
export type MonetizationBrowserFamily =
  "any" | "chrome" | "safari" | "firefox" | "edge" | "other";
export type MonetizationAdFormat =
  | "smartlink"
  | "inject_html"
  // Legacy formats remain readable so existing level configs can still be edited.
  | "action"
  | "banner"
  | "script";
export type MonetizationAdPlacement =
  | "unlock_redirect"
  | "popunder"
  | "action_list"
  | "stu_before"
  | "stu_after"
  | "safe_overlay_top"
  | "safe_overlay_bottom";
export type MonetizationOperatingSystem =
  | "any"
  | "android"
  | "ios"
  | "windows"
  | "macos"
  | "linux"
  | "other";
export type MonetizationActionPositionMode =
  | "start"
  | "end"
  | "middle"
  | "random";
export type MonetizationActionCooldownBehavior = "replace" | "hide";
export type MonetizationActionCooldownScope = "visitor" | "link";
export type MonetizationActionDisplayMode = "all" | "sequential";

export type MonetizationSmartlinkAppendParam = "slug" | "dataUrl";

export type MonetizationSmartlinkOverrides = {

  redirectDelaySeconds?: number;
  maxRedirectsPerSession?: number;
  maxRedirectsPerVisitor?: number;
  frequencyWindowHours?: number;
  cooldownMinutes?: number;
  startAt?: string;
  endAt?: string;
};

export type MonetizationSmartlink = {
  id: string;
  url: string;
  enabled: boolean;
  weight: number;
  sortOrder: number;
  /** Bỏ trống = chèn cả slug và dataUrl; mảng rỗng = giữ nguyên URL. */
  appendParams?: MonetizationSmartlinkAppendParam[];
  overrides?: MonetizationSmartlinkOverrides;
};

export type MonetizationAdTargetingExclusions = {
  countries: string[];
  devices: Exclude<MonetizationDeviceType, "any">[];
  operatingSystems: Exclude<MonetizationOperatingSystem, "any">[];
  browsers: Exclude<MonetizationBrowserFamily, "any">[];
  niches: string[];
  postTypes: string[];
  categoryIds: number[];
};

export type MonetizationAd = {
  id: string;
  name: string;
  enabled: boolean;
  format: MonetizationAdFormat;
  placements: MonetizationAdPlacement[];
  priority: number;
  weight: number;
  targeting: {
    countries: string[];
    devices: MonetizationDeviceType[];
    operatingSystems: MonetizationOperatingSystem[];
    browsers: MonetizationBrowserFamily[];
    niches: string[];
    postTypes: string[];
    categoryIds: number[];
    exclusions?: MonetizationAdTargetingExclusions;
  };
  content: {
    smartlinks?: MonetizationSmartlink[];
    /** Ads-action URL or legacy single-Smartlink payload. */
    targetUrl?: string;
    actionLabel?: string;
    actionIcon?: MonetizationActionIconKey;
    actionPlatform?: string;
    actionType?: string;
    /** @deprecated Numeric positions are only retained for legacy configurations. */
    actionPosition?: number;
    actionPositionMode?: MonetizationActionPositionMode;
    actionCooldownMinutes?: number;
    actionCooldownBehavior?: MonetizationActionCooldownBehavior;
    actionCooldownScope?: MonetizationActionCooldownScope;
    actionDisplayMode?: MonetizationActionDisplayMode;
    actionRotationGroup?: string;
    redirectDelaySeconds?: number;
    maxRedirectsPerSession?: number;
    maxRedirectsPerVisitor?: number;
    frequencyWindowHours?: number;
    cooldownMinutes?: number;
    startAt?: string;
    endAt?: string;
    imageUrl?: string;
    clickUrl?: string;
    title?: string;
    description?: string;
    ctaLabel?: string;
    newTab?: boolean;
    adapter?: string;
    scriptUrl?: string;
    zoneId?: string;
    parameters?: Record<string, string | number | boolean>;
    html?: string;
    css?: string;
    javascript?: string;
    height?: number;
  };
};

export type MonetizationLevelTranslation = {
  locale: string;
  name: string;
  description: string | null;
};

export type MonetizationRoute = {
  id: string;
  targeting: RouteTargeting;
  targetUrl: string;
  priority: number;
  weight: number;
  enabled: boolean;
};

export type MonetizationRate = {
  countryCode: string;
  deviceType: MonetizationDeviceType;
  baseCpm: string;
  dailyLimit: number | null;
  enabled: boolean;
};

export type MonetizationLevelMetaData = {
  version: 1;
  profitBps: number;
  stepCount: number;
  visitorExperience: {
    popup: MonetizationAdDensity;
    banner: MonetizationAdDensity;
    interstitial: MonetizationAdDensity;
    notification: MonetizationAdDensity;
  };
};

export type AdminMonetizationLevel = {
  id: number;
  key: string;
  displayName: string;
  status: MonetizationLevelStatus;
  isDefault: boolean;
  sortOrder: number;
  translations: MonetizationLevelTranslation[];
  routes: MonetizationRoute[];
  rates: MonetizationRate[];
  ads: MonetizationAd[];
  metaData: MonetizationLevelMetaData;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminMonetizationLevelPayload = Omit<
  AdminMonetizationLevel,
  "id" | "displayName" | "usersCount" | "createdAt" | "updatedAt"
>;

export type MonetizationLevelsResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminMonetizationLevel>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    summary: MonetizationLevelsSummary;
  };
};

export type MonetizationLevelsSummary = {
  publishedLevels: number;
  configuredRoutes: number;
  configuredRates: number;
  assignedUsers: number;
};

export type MonetizationLevelsTableData = {
  data: AdminMonetizationLevel[];
  pageCount: number;
  total: number;
  summary: MonetizationLevelsSummary;
};
