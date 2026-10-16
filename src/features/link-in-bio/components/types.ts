import type { BioPageDto } from "@/lib/api-client"

export type BioStatusFilter = "all" | "published" | "draft" | "paused"
export type BioSort = "updated" | "oldest" | "views" | "ctr" | "name"

export function getBioCtr(page: Pick<BioPageDto, "views" | "clicks">) {
  return page.views > 0 ? (page.clicks / page.views) * 100 : 0
}

export function getVisibleBioLinks(page: BioPageDto) {
  return page.customLinks.filter((link) => !page.hiddenLinks.includes(link.id)).length
}
