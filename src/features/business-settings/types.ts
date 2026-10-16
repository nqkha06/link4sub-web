import type {
  BackgroundImagePreset,
  BackgroundVideoPreset,
} from "@/contracts";

export type PublicBusinessConfig = {
  authentication: {
    registrationEnabled: boolean;
    googleLoginEnabled: boolean;
  };
  operations: {
    maintenanceMode: boolean;
    withdrawalsPaused: boolean;
    requireWithdrawalTrafficSource: boolean;
  };
  uploads: {
    memberFileMaxBytes: number;
    coverImageMaxBytes: number;
    allowedMimeTypes: string[];
  };
  presetLibrary: {
    images: BackgroundImagePreset[];
    videos: BackgroundVideoPreset[];
  };
};

export type AdminBusinessSettings = {
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
  googleLoginEnabled: boolean;
  baseCurrencyCode: string;
  withdrawalCurrencyCode: string;
  referralCommissionRate: string;
  loyaltyWindowDays: number;
  loyaltyHistoryDays: number;
  memberFileMaxBytes: number;
  coverImageMaxBytes: number;
  adminMediaMaxBytes: number;
  supportAttachmentMaxBytes: number;
  memberStorageQuotaBytes: number;
  uploadAllowedMimeTypes: string[];
  maintenanceMode: boolean;
  withdrawalsPaused: boolean;
  requireWithdrawalTrafficSource: boolean;
  updatedAt: string;
  currencies: Array<{
    code: string;
    name: string;
    symbol: string;
    exchangeRate: string;
    isBase: boolean;
    isDefault: boolean;
    isActive: boolean;
  }>;
  uiLanguages: {
    bundled: string[];
    source: "published-languages";
    fallbackLocale: string;
  };
};

export type AdminRegistrationSettings = {
  /** Base (accounting) currency the amounts are credited in. */
  currencyCode: string;
  signupBonusAmount: string;
  referralSignupBonusAmount: string;
  referrerSignupBonusAmount: string;
  updatedAt: string;
};

export type AdminWithdrawalSettings = {
  withdrawalCurrencyCode: string;
  withdrawalsPaused: boolean;
  requireWithdrawalTrafficSource: boolean;
  fastWithdrawalEnabled: boolean;
  fastWithdrawalFeeRate: string;
  updatedAt: string;
  currencies: AdminBusinessSettings["currencies"];
};
