import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminAnnouncement,
  AnnouncementDisplay,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementTargetType,
} from "@/features/announcements/types";
import { getSortingStateParser } from "@/lib/parsers";

export const announcementStatuses: AnnouncementStatus[] = ["draft", "scheduled", "active", "paused", "expired"];
export const announcementDisplays: AnnouncementDisplay[] = ["notification", "banner", "modal"];
export const announcementPriorities: AnnouncementPriority[] = ["low", "normal", "high", "critical"];
export const announcementTargetTypes: AnnouncementTargetType[] = ["all", "users", "roles"];

/** URL state of the admin announcements DataTable; keys match the column ids. */
export const announcementsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminAnnouncement>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  announcement: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(announcementStatuses)).withDefault([]),
  displayType: parseAsArrayOf(parseAsStringEnum(announcementDisplays)).withDefault([]),
  priority: parseAsArrayOf(parseAsStringEnum(announcementPriorities)).withDefault([]),
  targetType: parseAsArrayOf(parseAsStringEnum(announcementTargetTypes)).withDefault([]),
  // Date range filter: [fromTimestamp, toTimestamp] in ms, either side may be empty.
  createdAt: parseAsArrayOf(parseAsString).withDefault([]),
});

export type AnnouncementsTableQuery = Awaited<
  ReturnType<typeof announcementsSearchParamsCache.parse>
>;
