export type AdminSocialLinkStatus = "active" | "inactive" | "paused"
export type AdminSocialLinkDestinationType = "url" | "file" | "snippet"
export type AdminSocialLinkDeletionState = "active" | "deleted"
export type AdminSocialLinkSource = "web" | "api"

export type AdminSocialLinkOwner = {
  id: number
  name: string
  email: string
  avatar: string | null
}

export type AdminSocialLinkAction = {
  id: number
  platform: string
  action: string
  url: string
  position: number
}

export type AdminSocialLink = {
  id: number
  slug: string
  publicUrl: string
  title: string
  subtitle: string | null
  status: AdminSocialLinkStatus
  source: AdminSocialLinkSource
  destinationType: AdminSocialLinkDestinationType
  destinationUrl: string | null
  destinationFile: {
    id: string
    alias: string
    name: string
  } | null
  destinationSnippet: {
    id: string
    name: string
  } | null
  views: number
  revenue: string
  actionsCount: number
  platforms: string[]
  actions: AdminSocialLinkAction[]
  expiresAt: string | null
  maxClicks: number | null
  owner: AdminSocialLinkOwner
  deletedAt: string | null
  deletedState: AdminSocialLinkDeletionState
  createdAt: string
  updatedAt: string
}

export type AdminSocialLinkPayload = {
  title: string
  subtitle: string
  status: AdminSocialLinkStatus
  destinationUrl?: string
}

export type AdminSocialLinksResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminSocialLink>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    totalViews: number
    totalRevenue: string
  }
}

export type AdminSocialLinksTableData = {
  data: AdminSocialLink[]
  pageCount: number
  total: number
  totalViews: number
  totalRevenue: string
}

export type AdminSocialLinksStatistics = {
  generatedAt: string
  period: {
    range: "week" | "month" | "year" | "all" | "custom"
    from: string
    to: string
    days: number
  }
  totals: {
    links: number
    deletedLinks: number
    owners: number
    views: number
    revenue: string
    actions: number
  }
  creations: {
    byDay: Array<{
      date: string
      count: number
    }>
  }
  statuses: Array<{
    status: AdminSocialLinkStatus
    count: number
  }>
  destinations: Array<{
    type: AdminSocialLinkDestinationType
    count: number
  }>
  platforms: Array<{
    platform: string
    count: number
  }>
}
