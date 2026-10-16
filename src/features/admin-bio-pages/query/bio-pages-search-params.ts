import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

import type { AdminBioPageListItem, BioPageStatus } from "@/features/admin-bio-pages/types";
import { getSortingStateParser } from "@/lib/parsers";

const statuses: BioPageStatus[] = ["published", "draft"];

/** URL state of the admin bio pages DataTable; keys match the column ids. */
export const bioPagesSearchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: getSortingStateParser<AdminBioPageListItem>().withDefault([
    { id: "updatedAt", desc: true },
  ]),
  name: parseAsString.withDefault(""),
  status: parseAsArrayOf(parseAsStringEnum(statuses)).withDefault([]),
});

export type BioPagesTableQuery = Awaited<ReturnType<typeof bioPagesSearchParamsCache.parse>>;
