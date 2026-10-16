import type { AdminSnippetsTableQuery } from "@/features/admin-snippets/query/snippets-search-params"
import { getValidFilters } from "@/lib/data-table"

export function serializeAdminSnippetsQuery(state: AdminSnippetsTableQuery) {
  const query = new URLSearchParams({
    page: String(state.page),
    perPage: String(state.perPage),
    sort: JSON.stringify(state.sort),
    filters: JSON.stringify(getValidFilters(state.filters)),
    joinOperator: state.joinOperator,
  })

  if (state.search) query.set("search", state.search)
  if (state.userId) query.set("userId", String(state.userId))
  if (state.deletedState.length) {
    query.set("deletedState", state.deletedState.join(","))
  }
  return query.toString()
}
