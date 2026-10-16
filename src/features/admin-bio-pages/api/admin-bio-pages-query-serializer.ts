import type { BioPagesTableQuery } from "@/features/admin-bio-pages/query/bio-pages-search-params";

const sortableColumns = new Set(["name", "views", "clicks", "createdAt", "updatedAt"]);

export function serializeBioPagesTableQuery(state: BioPagesTableQuery) {
  const primarySort = state.sort[0];
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy: primarySort && sortableColumns.has(primarySort.id) ? primarySort.id : "updatedAt",
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
  });
  if (state.name.trim()) query.set("search", state.name.trim());
  if (state.status.length) query.set("status", state.status.join(","));
  return query.toString();
}
