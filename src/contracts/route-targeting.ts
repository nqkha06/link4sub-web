export type TargetingList = { include: string[]; exclude: string[] };
export type RouteTargetingMatchMode = "all" | "any";
export type RouteTargeting = {
  matchMode: RouteTargetingMatchMode;
  countries: TargetingList;
  devices: TargetingList;
  operatingSystems: TargetingList;
  browsers: TargetingList;
};

export const routeDeviceValues = ["desktop", "mobile", "tablet"] as const;
export const routeOperatingSystemValues = ["android", "ios", "windows", "macos", "linux", "other"] as const;
export const routeBrowserValues = ["chrome", "safari", "firefox", "edge", "opera", "other"] as const;

export function defaultRouteTargeting(): RouteTargeting {
  return {
    matchMode: "all",
    countries: { include: [], exclude: [] },
    devices: { include: [], exclude: [] },
    operatingSystems: { include: [], exclude: [] },
    browsers: { include: [], exclude: [] },
  };
}

type LegacyRouteTargeting = {
  targeting?: RouteTargeting;
  countryCode?: string;
  countryMode?: string;
  deviceType?: string;
  deviceMode?: string;
  browserFamily?: string;
  browserMode?: string;
};

/** Read old single-value routes; all new writes use targeting lists. */
export function normalizeRouteTargeting(route: LegacyRouteTargeting): RouteTargeting {
  if (route.targeting) {
    const normalize = (list?: TargetingList): TargetingList => ({
      include: [...new Set(list?.include ?? [])],
      exclude: [...new Set(list?.exclude ?? [])],
    });
    return {
      matchMode: route.targeting.matchMode === "any" ? "any" : "all",
      countries: normalize(route.targeting.countries),
      devices: normalize(route.targeting.devices),
      operatingSystems: normalize(route.targeting.operatingSystems),
      browsers: normalize(route.targeting.browsers),
    };
  }
  const legacyList = (value: string, mode: string | undefined, wildcard: string): TargetingList => {
    if (mode === "exclude") {
      if (value === wildcard) throw new Error("Invalid legacy wildcard exclusion");
      return { include: [], exclude: [value] };
    }
    return { include: value === wildcard ? [] : [value], exclude: [] };
  };
  return {
    matchMode: "all",
    countries: legacyList(route.countryCode ?? "ALL", route.countryMode, "ALL"),
    devices: legacyList(route.deviceType ?? "any", route.deviceMode, "any"),
    operatingSystems: { include: [], exclude: [] },
    browsers: legacyList(route.browserFamily ?? "any", route.browserMode, "any"),
  };
}

export function matchesTargetingList(value: string, list: TargetingList): boolean {
  return !list.exclude.includes(value) &&
    (list.include.length === 0 || list.include.includes(value));
}
