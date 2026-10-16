import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type {
  AdminLinkReportListItem,
  LinkReportReason,
  LinkReportStatus,
} from "@/features/admin-link-reports/types";
import { getSortingStateParser } from "@/lib/parsers";

export const linkReportStatuses: LinkReportStatus[] = [
  "pending",
  "reviewing",
  "resolved",
  "dismissed",
];

export const linkReportReasons: LinkReportReason[] = [
  "spam",
  "malware",
  "impersonation",
  "copyright",
  "adult",
  "other",
];

/** URL state of the admin link reports DataTable; keys match the column ids. */
export const linkReportsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminLinkReportListItem>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  report: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(linkReportStatuses)).withDefault([]),
  reason: parseAsArrayOf(parseAsStringEnum(linkReportReasons)).withDefault([]),
  // Date range filter: [fromTimestamp, toTimestamp] in ms, either side may be empty.
  createdAt: parseAsArrayOf(parseAsString).withDefault([]),
});

export type LinkReportsTableQuery = Awaited<
  ReturnType<typeof linkReportsSearchParamsCache.parse>
>;
