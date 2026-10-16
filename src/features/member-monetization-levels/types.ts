export type MemberMonetizationAdDensity = "none" | "limited" | "maximum";

export type MemberMonetizationLevel = {
  id: number;
  key: string;
  isDefault: boolean;
  sortOrder: number;
  translations: Array<{
    locale: string;
    name: string;
    description: string | null;
  }>;
  rates: Array<{
    countryCode: string;
    deviceType: "any" | "desktop" | "mobile" | "tablet";
    baseCpm: string;
    dailyLimit: number | null;
  }>;
  metaData: {
    version: 1;
    profitBps: number;
    stepCount: number;
    visitorExperience: {
      popup: MemberMonetizationAdDensity;
      banner: MemberMonetizationAdDensity;
      interstitial: MemberMonetizationAdDensity;
      notification: MemberMonetizationAdDensity;
    };
  };
};

export type MemberMonetizationLevelsResponse = Omit<
  import("@/contracts").PaginatedApiResponse<MemberMonetizationLevel>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    selectedLevelId: number | null;
    effectiveLevelId: number | null;
    usesSystemDefault: boolean;
    totalLinks: number;
    defaultLocale: string;
  };
};
