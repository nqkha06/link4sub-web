import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

import type { AdminSnippet } from "@/features/admin-snippets/types"
import { getFiltersStateParser, getSortingStateParser } from "@/lib/parsers"

export const adminSnippetsSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminSnippet>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  search: parseAsString.withDefault(""),
  userId: parseAsInteger,
  deletedState: parseAsArrayOf(
    parseAsStringEnum(["active", "deleted"]),
  ).withDefault(["active"]),
  filters: getFiltersStateParser<AdminSnippet>().withDefault([]),
  joinOperator: parseAsStringEnum(["and", "or"]).withDefault("and"),
})

export type AdminSnippetsTableQuery = Awaited<
  ReturnType<typeof adminSnippetsSearchParamsCache.parse>
>
