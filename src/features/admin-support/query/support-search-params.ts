import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  SupportCategory,
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";
import type { AdminSupportTicketListItem } from "@/features/admin-support/types";
import { getSortingStateParser } from "@/lib/parsers";

const statuses: SupportRequestStatus[] = ["submitted", "in_progress", "waiting_user", "answered", "resolved", "closed"];
const priorities: SupportTicketPriority[] = ["low", "normal", "high", "urgent"];
const categories: SupportCategory[] = [
  "usage", "technical", "social_links", "files", "link_in_bio", "monetization",
  "withdrawal", "rewards", "account", "abuse", "other",
];

/** URL state of the admin support DataTable; keys match the column ids. */
export const supportSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminSupportTicketListItem>().withDefault([
    { id: "lastMessageAt", desc: true },
  ]),
  ticket: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  priority: parseAsArrayOf(parseAsStringEnum(priorities)).withDefault([]),
  category: parseAsArrayOf(parseAsStringEnum(categories)).withDefault([]),
  assignment: parseAsArrayOf(parseAsStringEnum(["mine", "unassigned"])).withDefault([]),
});

export type SupportTableQuery = Awaited<ReturnType<typeof supportSearchParamsCache.parse>>;
