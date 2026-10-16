import type {
  AdminSnippetsTableData,
  AdminSnippetsResponse,
} from "@/features/admin-snippets/types"

export function adaptAdminSnippetsResponse(
  response: AdminSnippetsResponse,
): AdminSnippetsTableData {
  return {
    data: response.data,
    total: response.meta.total,
    pageCount: response.meta.totalPages,
  }
}
