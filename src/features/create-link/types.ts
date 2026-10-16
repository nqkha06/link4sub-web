import type { LinkActionDto } from "@/lib/api-client"

export type AnonymousBackgroundSettings = {
  selectedBackgroundId?: string
  selectedBackgroundName?: string
  backgroundMediaType?: "image" | "video" | "youtube"
  backgroundMediaUrl?: string
  effects?: {
    opacity?: number
    blur?: number
    saturation?: number
    contrast?: number
    grayscale?: number
  }
}

/**
 * A link composed on the public /create page by a visitor who isn't signed
 * in yet. It is kept client-side only (sessionStorage) until the visitor
 * signs up or logs in, at which point /member/create reads it and prefills
 * the real (authenticated) link creator so the user can review and publish.
 */
export type AnonymousLinkDraft = {
  createdAt: number
  inputType: "url" | "snippet"
  destinationUrl?: string
  snippetContent?: string
  title?: string
  subtitle?: string
  customAlias?: string
  actions: LinkActionDto[]
  backgroundSettings?: AnonymousBackgroundSettings
  expiryEnabled?: boolean
  expiryType?: "date" | "clicks"
  expiryDate?: string
  expiryTime?: string
  maxClicks?: number
}
