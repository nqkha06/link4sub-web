export type LinkSettings = {
  publicDomain: string;
  socialPrefix: string;
  bioPrefix: string;
  aliasLength: number;
  aliasCaseSensitive: boolean;
  updatedAt?: string;
};

export type AdminLinkSettings = LinkSettings & {
  cleanupInactiveEnabled: boolean;
  cleanupInactiveDays: number;
  cleanupApiEnabled: boolean;
  cleanupApiDays: number;
  cleanupExpiredEnabled: boolean;
  cleanupExpiredDays: number;
  cleanupTrashEnabled: boolean;
  cleanupTrashDays: number;
  cleanupAccessLogRetentionDays: number;
};

export type LinkCleanupPreview = {
  generatedAt: string;
  rules: {
    inactive: { enabled: boolean; days: number; matched: number };
    api_age: { enabled: boolean; days: number; matched: number };
    expired: { enabled: boolean; days: number; matched: number };
    trash_retention: {
      enabled: boolean;
      days: number;
      accessLogRetentionDays: number;
      matched: number;
    };
  };
};

export function linkPath(
  settings: Pick<LinkSettings, "socialPrefix" | "bioPrefix">,
  kind: "social" | "bio",
  alias: string,
) {
  const prefix = kind === "social" ? settings.socialPrefix : settings.bioPrefix;
  return prefix ? `/${prefix}/${alias}` : `/${alias}`;
}
export function linkUrl(
  settings: Pick<LinkSettings, "publicDomain" | "socialPrefix" | "bioPrefix">,
  kind: "social" | "bio",
  alias: string,
) {
  try {
    return new URL(linkPath(settings, kind, alias), settings.publicDomain).toString();
  } catch {
    return `${settings.publicDomain.replace(/\/$/, "")}${linkPath(settings, kind, alias)}`;
  }
}
