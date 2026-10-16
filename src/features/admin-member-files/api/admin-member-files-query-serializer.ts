import type { MemberFilesTableQuery } from "@/features/admin-member-files/query/member-files-search-params";

const sortableColumns = new Set(["name", "size", "downloadCount", "createdAt"]);

export function serializeMemberFilesTableQuery(state: MemberFilesTableQuery) {
  const primarySort = state.sort[0];
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy: primarySort && sortableColumns.has(primarySort.id) ? primarySort.id : "createdAt",
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
    state: state.state[0] ?? "active",
  });
  if (state.name.trim()) query.set("search", state.name.trim());
  if (state.owner.trim()) query.set("owner", state.owner.trim());
  if (state.type[0]) query.set("type", state.type[0]);
  if (state.userId) query.set("userId", String(state.userId));
  return query.toString();
}
