export type AdminSnippetDeletionState = "active" | "deleted"

export type AdminSnippetOwner = {
  id: number
  name: string
  email: string
  avatar: string | null
}

export type AdminSnippet = {
  id: number
  name: string
  content: string
  contentLength: number
  owner: AdminSnippetOwner
  linksCount: number
  deletedAt: string | null
  deletedState: AdminSnippetDeletionState
  createdAt: string
  updatedAt: string
}

export type AdminSnippetsResponse = import("@/contracts").PaginatedApiResponse<AdminSnippet>

export type AdminSnippetsTableData = {
  data: AdminSnippet[]
  total: number
  pageCount: number
}

export type UpdateAdminSnippetPayload = {
  name: string
  content: string
}

export type CreateAdminSnippetPayload = {
  userId: number
  name?: string
  content: string
}
