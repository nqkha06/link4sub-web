import type { PublicationStatus } from "@/types/publication-status";

export type LoyaltyTierIconKey =
  | "sparkles"
  | "shield-check"
  | "trophy"
  | "gem";

export type AdminLoyaltyBenefit = {
  key: string;
  label: string;
  included: boolean;
  value: string | null;
};

export type AdminLoyaltyTierTranslation = {
  locale: string;
  name: string;
  description: string | null;
  benefits: AdminLoyaltyBenefit[];
};

export type LoyaltySupportPriority = "normal" | "high" | "urgent";

/** Đặc quyền hệ thống thực thi cho member thuộc hạng; null = dùng cấu hình chung. */
export type AdminLoyaltyTierPerks = {
  minWithdrawAmount: number | null;
  cpmBonusPercent: number;
  referralCommissionRate: number | null;
  apiAccess: boolean;
  storageQuotaMb: number | null;
  freeFastWithdrawalsPerMonth: number;
  supportPriority: LoyaltySupportPriority;
};

export type AdminLoyaltyTier = {
  id: number;
  key: string;
  displayName: string;
  minimumValidViews: number;
  sortOrder: number;
  iconKey: LoyaltyTierIconKey | null;
  status: PublicationStatus;
  perks: AdminLoyaltyTierPerks;
  translations: AdminLoyaltyTierTranslation[];
  benefitsCount: number;
  includedBenefitsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminLoyaltyTierPayload = Omit<
  AdminLoyaltyTier,
  | "id"
  | "displayName"
  | "benefitsCount"
  | "includedBenefitsCount"
  | "createdAt"
  | "updatedAt"
>;

export type LoyaltyTiersSummary = {
  publishedTiers: number;
  configuredBenefits: number;
  highestThreshold: number;
};

export type LoyaltyTiersResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminLoyaltyTier>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    summary: LoyaltyTiersSummary;
  };
};

export type LoyaltyTiersTableData = {
  data: AdminLoyaltyTier[];
  pageCount: number;
  total: number;
  summary: LoyaltyTiersSummary;
};
