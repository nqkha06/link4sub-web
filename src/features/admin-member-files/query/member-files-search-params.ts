import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import {
  ADMIN_FILE_STATES,
  ADMIN_FILE_TYPES,
  type AdminMemberFile,
} from "@/features/admin-member-files/types";
import { getSortingStateParser } from "@/lib/parsers";

/** URL state of the admin member files DataTable; keys match the column ids. */
export const memberFilesSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  sort: getSortingStateParser<AdminMemberFile>().withDefault([
    { id: "createdAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  owner: parseAsString.withDefault(""),
  type: parseAsArrayOf(parseAsStringEnum(ADMIN_FILE_TYPES)).withDefault([]),
  state: parseAsArrayOf(parseAsStringEnum(ADMIN_FILE_STATES)).withDefault([]),
  userId: parseAsInteger,
});

export type MemberFilesTableQuery = Awaited<
  ReturnType<typeof memberFilesSearchParamsCache.parse>
>;
