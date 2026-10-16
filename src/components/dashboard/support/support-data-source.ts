import {
  createMemberSupportTicket,
  getMemberSupportTicket,
  getMemberSupportTickets,
  replyMemberSupportTicket,
} from "@/features/support/api/support.client";
import type {
  SupportCategory,
  SupportDashboardData,
  SupportDataSource,
} from "./types";

const dashboard: SupportDashboardData = {
  attachmentConfig: {
    acceptedTypes: ".png,.jpg,.jpeg,.webp,.txt,.log,.pdf",
    maxSizeMb: 5,
  },
  requests: [],
};

export function getSupportContentData() {
  return structuredClone(dashboard);
}

export const supportDataSource: SupportDataSource = {
  async getDashboard() {
    return {
      ...getSupportContentData(),
      requests: await getMemberSupportTickets(),
    };
  },
  getRequest: getMemberSupportTicket,
  createRequest: createMemberSupportTicket,
  replyToRequest: replyMemberSupportTicket,
};

/** Thứ tự loại yêu cầu trong form; nhãn nằm ở Support.categories.* trong file dịch. */
export const supportCategories = [
  "usage",
  "technical",
  "social_links",
  "files",
  "link_in_bio",
  "monetization",
  "withdrawal",
  "rewards",
  "account",
  "abuse",
  "other",
] as const satisfies readonly SupportCategory[];

/** Trang/đối tượng liên quan; nhãn nằm ở Support.resources.*. */
export const supportResources = ["none", "social-link", "file", "link-in-bio", "withdrawal", "reward"] as const;
