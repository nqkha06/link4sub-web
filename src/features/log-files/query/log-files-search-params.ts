import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const logFilesSearchParamsCache = createSearchParamsCache({
  channel: parseAsStringEnum(["queue", "worker"]),
  file: parseAsString,
  level: parseAsStringEnum(["debug", "info", "warning", "error"]),
  q: parseAsString.withDefault(""),
  order: parseAsStringEnum(["asc", "desc"]).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(50),
});

export type LogFilesQuery = Awaited<ReturnType<typeof logFilesSearchParamsCache.parse>>;
