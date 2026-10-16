import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations } from "next-intl/server"

import { Suspense } from "react"
import { RefreshCw } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Button } from "@/components/ui/button"
import { getAdminDashboard } from "@/features/admin-dashboard/api/dashboard.server"
import {
  AdminDashboard,
  AdminDashboardSkeleton,
} from "@/features/admin-dashboard/components/admin-dashboard"
import type { AdminDashboardRange } from "@/features/admin-dashboard/types"

export const metadata: Metadata = { title: "Tổng quan" }

const ranges: Array<{ value: AdminDashboardRange; labelKey: string }> = [
  { value: "7d", labelKey: "last7d" },
  { value: "30d", labelKey: "last30d" },
  { value: "90d", labelKey: "last90d" },
]

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const t = await getTranslations("Admin.routes.dashboard")
  const params = await searchParams
  const value = Array.isArray(params.range) ? params.range[0] : params.range
  const range: AdminDashboardRange =
    value === "7d" || value === "90d" ? value : "30d"
  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex rounded-lg border border-border bg-muted/20 p-1"
              aria-label={t("rangeLabel")}
            >
              {ranges.map((item) => (
                <Button
                  key={item.value}
                  asChild
                  variant={range === item.value ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 shadow-none"
                >
                  <Link href={`/admin?range=${item.value}`}>{t(`ranges.${item.labelKey}`)}</Link>
                </Button>
              ))}
            </div>
            <Button asChild variant="outline" size="icon" className="shadow-none">
              <Link href={`/admin?range=${range}`} aria-label={t("refresh")}>
                <RefreshCw />
              </Link>
            </Button>
          </div>
        }
      />
      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboardContent range={range} />
      </Suspense>
    </main>
  )
}

async function AdminDashboardContent({
  range,
}: {
  range: AdminDashboardRange
}) {
  const data = await getAdminDashboard(range)
  return <AdminDashboard data={data} />
}
