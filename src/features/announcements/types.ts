export type AnnouncementType = "info" | "success" | "warning" | "danger" | "update";
export type AnnouncementPriority = "low" | "normal" | "high" | "critical";
export type AnnouncementDisplay = "notification" | "banner" | "modal";
export type AnnouncementStatus = "draft" | "scheduled" | "active" | "paused" | "expired";
export type AnnouncementTargetType = "all" | "users" | "roles";

export type AnnouncementTargetRules = {
  userIds?: number[];
  roles?: string[];
};

export type AnnouncementTranslation = {
  locale: string;
  title: string;
  summary: string | null;
  content: string;
  actionLabel: string | null;
};

export type AnnouncementState = {
  seenAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  acknowledgedAt: string | null;
  ctaClickedAt: string | null;
};

export type MemberAnnouncement = {
  id: number;
  slug: string;
  locale: string;
  title: string;
  summary: string | null;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  actionLabel: string | null;
  actionUrl: string | null;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  state: AnnouncementState;
};

export type AnnouncementAnalytics = {
  eligible: number;
  seen: number;
  read: number;
  dismissed: number;
  acknowledged: number;
  clicked: number;
  readRate: number;
  clickRate: number;
};

export type AdminAnnouncement = Omit<MemberAnnouncement, "state"> & {
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetRules: AnnouncementTargetRules;
  analytics: AnnouncementAnalytics;
  createdBy: { id: number; name: string; email: string } | null;
  updatedBy: { id: number; name: string; email: string } | null;
  updatedAt: string;
  translations: AnnouncementTranslation[];
};

export type AnnouncementPayload = {
  translations: Array<{
    locale: string;
    title: string;
    summary?: string;
    content: string;
    actionLabel?: string;
  }>;
  slug?: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  displayType: AnnouncementDisplay;
  status: AnnouncementStatus;
  targetType: AnnouncementTargetType;
  targetRules: AnnouncementTargetRules;
  actionUrl?: string;
  isDismissible: boolean;
  requiresAcknowledgement: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type PaginatedAnnouncements<T> = import("@/contracts").PaginatedApiResponse<T>;

/**
 * Translation keys (namespace `Admin.announcements`) for the enum labels.
 * Resolve them at render time with `t(announcementTypeKeys[type])`.
 */
export const announcementTypeKeys: Record<AnnouncementType, string> = {
  info: "type.info",
  success: "type.success",
  warning: "type.warning",
  danger: "type.danger",
  update: "type.update",
};

export const announcementDisplayKeys: Record<AnnouncementDisplay, string> = {
  notification: "display.notification",
  banner: "display.banner",
  modal: "display.modal",
};

export const announcementStatusKeys: Record<AnnouncementStatus, string> = {
  draft: "status.draft",
  scheduled: "status.scheduled",
  active: "status.active",
  paused: "status.paused",
  expired: "status.expired",
};
