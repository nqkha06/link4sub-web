import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import type { Metadata } from "next"

import { getTranslations } from "next-intl/server"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton"
import { Button } from "@/components/ui/button"
import { getAdminSnippetsTableData } from "@/features/admin-snippets/api/snippets.server"
import { SnippetsTable } from "@/features/admin-snippets/components/snippets-table"
import { adminSnippetsSearchParamsCache } from "@/features/admin-snippets/query/snippets-search-params"
import { requireAdmin } from "@/lib/auth/server-access"

export const metadata: Metadata = { title: "Đoạn nội dung" }

type SearchParams = Record<string, string | string[] | undefined>

export default async function AdminSnippetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const t = await getTranslations("Admin.routes.snippets")
  const { currentUser } = await requireAdmin()
  if (!currentUser.permissions?.includes("snippets.read")) {
    redirect("/admin")
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          currentUser.permissions.includes("snippets.create") ? (
            <Button asChild>
              <Link href="/admin/snippets?create=1">
                <Plus /> {t("create")}
              </Link>
            </Button>
          ) : null
        }
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={9}
            filterCount={3}
            cellWidths={["3rem", "20rem", "14rem", "8rem", "8rem"]}
            shrinkZero
          />
        }
      >
        <SnippetsTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function SnippetsTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const search = adminSnippetsSearchParamsCache.parse(await searchParams)
  const result = await getAdminSnippetsTableData(search)
  return <SnippetsTable {...result} filteredUserId={search.userId} />
}
