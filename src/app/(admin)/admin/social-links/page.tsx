import { Suspense } from "react"
import type { Metadata } from "next"

import { getTranslations } from "next-intl/server"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { getAdminSocialLinksTableData } from "@/features/admin-social-links/api/social-links.server"
import { SocialLinksTable } from "@/features/admin-social-links/components/social-links-table"
import { SocialLinksStatisticsAction } from "@/features/admin-social-links/components/social-links-statistics-action"
import { socialLinksSearchParamsCache } from "@/features/admin-social-links/query/social-links-search-params"

export const metadata: Metadata = { title: "Liên kết xã hội" }

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminSocialLinksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const t = await getTranslations("Admin.routes.socialLinks")

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={<SocialLinksStatisticsAction />}
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={10}
            filterCount={5}
            cellWidths={[
              "3rem",
              "18rem",
              "15rem",
              "8rem",
              "7rem",
              "6rem",
            ]}
            shrinkZero
          />
        }
      >
        <SocialLinksTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function SocialLinksTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = socialLinksSearchParamsCache.parse(await searchParams)
  const result = await getAdminSocialLinksTableData(search)
  return <SocialLinksTable {...result} filteredUserId={search.userId} />
}
