"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Home, Plus, SearchX, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { EmptyCard } from "@/components/dashboard/empty-card"
import { UnderlineTabs } from "@/components/member/underline-tabs"
import {
  deleteBioPage,
  getBioPages,
  type BioPageDto,
} from "@/lib/api-client"
import { LinkInBioGrid } from "./link-in-bio-grid"
import { PageContainer, PageHeader } from "@/components/dashboard/ui"
import { LinkInBioEmptyState, LinkInBioErrorState, LinkInBioSkeleton } from "./link-in-bio-states"
import { LinkInBioToolbar } from "./link-in-bio-toolbar"
import { getBioCtr, type BioSort, type BioStatusFilter } from "./types"
import { CreateBioDialog } from "../create/create-bio-dialog"
import { BIO_NEW_PAGE_PARAM, BIO_PUBLISH_INTENT_PARAM, type BioAccess } from "../create/create-bio-page"

type BioTab = "overview" | "create"

const bioTabs: Array<{ id: BioTab; labelKey: "overview" | "create"; icon: LucideIcon }> = [
  { id: "overview", labelKey: "overview", icon: Home },
  { id: "create", labelKey: "create", icon: Plus },
]

function isBioTab(value: string | null): value is BioTab {
  return value === "overview" || value === "create"
}

export function BioView() {
  const t = useTranslations("LinkInBio.page")
  const [bioPages, setBioPages] = useState<BioPageDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<BioStatusFilter>("all")
  const [sort, setSort] = useState<BioSort>("updated")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedTab = searchParams.get("tab")
  const activeTab: BioTab = isBioTab(requestedTab) ? requestedTab : "overview"

  const changeTab = useCallback((tab: BioTab) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    if (tab === "overview") nextParams.delete("tab")
    else nextParams.set("tab", tab)
    const query = nextParams.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const openEditorForNewPage = (page: BioPageDto, access: BioAccess) => {
    const params = new URLSearchParams({ [BIO_NEW_PAGE_PARAM]: "1" })
    if (access === "published") params.set(BIO_PUBLISH_INTENT_PARAM, "1")
    router.push(`/member/bio/${page.id}/edit?${params.toString()}`)
  }

  const loadBioPages = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getBioPages()
      setBioPages(data)
      setError("")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void Promise.resolve().then(loadBioPages)
  }, [loadBioPages])

  const visiblePages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi")
    const filtered = bioPages.filter((page) => {
      const matchesQuery = !normalizedQuery || `${page.name} ${page.slug}`.toLocaleLowerCase("vi").includes(normalizedQuery)
      const matchesStatus = status === "all" || page.status === status
      return matchesQuery && matchesStatus
    })

    return filtered.sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === "views") return b.views - a.views
      if (sort === "ctr") return getBioCtr(b) - getBioCtr(a)
      if (sort === "name") return a.name.localeCompare(b.name, "vi")
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [bioPages, query, sort, status])

  const removeBio = async (page: BioPageDto) => {
    try {
      await deleteBioPage(page.id)
      setBioPages((current) => current.filter((item) => item.id !== page.id))
      toast.success(t("deleted"))
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : t("deleteError"))
      throw deleteError
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
      />

      <BioTabs activeTab={activeTab} onChange={changeTab} />

      <div className="space-y-5">
        {bioPages.length > 0 || loading ? (
          <LinkInBioToolbar
            query={query}
            status={status}
            sort={sort}
            onQueryChange={setQuery}
            onStatusChange={setStatus}
            onSortChange={setSort}
          />
        ) : null}

        {error ? <LinkInBioErrorState message={error} onRetry={() => void loadBioPages()} /> : null}
        {!error && loading ? <LinkInBioSkeleton /> : null}
        {!error && !loading && bioPages.length === 0 ? <LinkInBioEmptyState /> : null}
        {!error && !loading && bioPages.length > 0 && visiblePages.length === 0 ? (
          <EmptyCard
            icon={SearchX}
            title={t("noResults")}
            action={{ label: t("clearFilters"), onClick: () => { setQuery(""); setStatus("all") } }}
          />
        ) : null}
        {!error && !loading && visiblePages.length > 0 ? (
          <LinkInBioGrid pages={visiblePages} onEdit={(page) => router.push(`/member/bio/${page.id}/edit`)} onDelete={removeBio} />
        ) : null}
      </div>

      <CreateBioDialog
        open={activeTab === "create"}
        onOpenChange={(open) => changeTab(open ? "create" : "overview")}
        onCreated={openEditorForNewPage}
      />
    </PageContainer>
  )
}

function BioTabs({ activeTab, onChange }: { activeTab: BioTab; onChange: (tab: BioTab) => void }) {
  const t = useTranslations("LinkInBio.tabs")

  return (
    <UnderlineTabs
      items={bioTabs.map((tab) => ({ id: tab.id, label: t(tab.labelKey), icon: tab.icon }))}
      value={activeTab}
      onChange={onChange}
      ariaLabel={t("label")}
    />
  )
}
