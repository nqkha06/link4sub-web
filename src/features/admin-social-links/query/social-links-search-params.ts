import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

import type {
  AdminSocialLink,
  AdminSocialLinkDeletionState,
  AdminSocialLinkDestinationType,
  AdminSocialLinkSource,
  AdminSocialLinkStatus,
} from "@/features/admin-social-links/types"
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers"

const statuses: AdminSocialLinkStatus[] = ["active", "inactive", "paused"]
const destinationTypes: AdminSocialLinkDestinationType[] = [
  "url",
  "file",
  "snippet",
]
const deletionStates: AdminSocialLinkDeletionState[] = ["active", "deleted"]
const sources: AdminSocialLinkSource[] = ["web", "api"]

/**
 * Bộ lọc nhanh trên thanh công cụ (ngoài bộ lọc nâng cao). Dùng chung cho
 * server (parse URL) và client (đọc/ghi URL) để hai phía luôn khớp nhau,
 * kể cả giá trị mặc định của `deletedState`.
 */
export const socialLinksQuickFilterParsers = {
  title: parseAsString.withDefault(""),
  owner: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
  destinationType: parseAsArrayOf(
    parseAsStringEnum(destinationTypes),
  ).withDefault([]),
  source: parseAsArrayOf(parseAsStringEnum(sources)).withDefault([]),
  deletedState: parseAsArrayOf(
    parseAsStringEnum(deletionStates),
  ).withDefault(["active"]),
}

export const socialLinksSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminSocialLink>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  userId: parseAsInteger,
  ...socialLinksQuickFilterParsers,
  filters: getFiltersStateParser<AdminSocialLink>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type AdminSocialLinksTableQuery = Awaited<
  ReturnType<typeof socialLinksSearchParamsCache.parse>
>
