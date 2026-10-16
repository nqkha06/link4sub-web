import type { SupportTableQuery } from "@/features/admin-support/query/support-search-params";

const sortableColumns = new Set(["lastMessageAt", "createdAt"]);

export function serializeSupportTableQuery(state: SupportTableQuery) {
  const primarySort = state.sort[0];
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sortBy: primarySort && sortableColumns.has(primarySort.id) ? primarySort.id : "lastMessageAt",
    sortOrder: primarySort?.desc === false ? "asc" : "desc",
  });

  if (state.ticket.trim()) query.set("search", state.ticket.trim());
  if (state.status.length) query.set("status", state.status.join(","));
  if (state.priority.length) query.set("priority", state.priority.join(","));
  if (state.category.length) query.set("category", state.category.join(","));
  // Single-choice filter; the last picked option wins.
  const assignment = state.assignment.at(-1);
  if (assignment) query.set("assignment", assignment);

  return query.toString();
}
