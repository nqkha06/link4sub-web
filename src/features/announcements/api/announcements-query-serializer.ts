import type { AnnouncementsTableQuery } from "@/features/announcements/query/announcements-search-params";

const sortableColumns = new Set(["createdAt", "updatedAt", "startsAt", "endsAt"]);
const DAY_MS = 24 * 60 * 60 * 1000;

export function serializeAnnouncementsTableQuery(state: AnnouncementsTableQuery) {
  const primarySort = state.sort[0];
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy: primarySort && sortableColumns.has(primarySort.id) ? primarySort.id : "createdAt",
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
  });

  if (state.announcement.trim()) query.set("search", state.announcement.trim());
  if (state.status.length) query.set("status", state.status.join(","));
  if (state.displayType.length) query.set("displayType", state.displayType.join(","));
  if (state.priority.length) query.set("priority", state.priority.join(","));
  if (state.targetType.length) query.set("targetType", state.targetType.join(","));

  const [from, to] = state.createdAt.map(toTimestamp);
  if (from !== null && from !== undefined) query.set("dateFrom", new Date(from).toISOString());
  // The picker returns the start of the selected day; include that whole day.
  if (to !== null && to !== undefined) query.set("dateTo", new Date(to + DAY_MS - 1).toISOString());

  return query.toString();
}

function toTimestamp(value: string) {
  const timestamp = Number(value);
  return value && Number.isFinite(timestamp) ? timestamp : null;
}
