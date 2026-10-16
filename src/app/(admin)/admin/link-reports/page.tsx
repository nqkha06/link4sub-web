import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { getAdminLinkReportsTableData } from "@/features/admin-link-reports/api/admin-link-reports.server";
import { AdminLinkReportsTable } from "@/features/admin-link-reports/components/admin-link-reports-table";
import { linkReportsSearchParamsCache } from "@/features/admin-link-reports/query/link-reports-search-params";
import { requireAdmin } from "@/lib/auth/server-access";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Báo cáo liên kết" };

export default async function AdminLinkReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.routes.linkReports");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("link-reports.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={7}
            filterCount={4}
            cellWidths={["2.5rem", "18rem", "12rem", "10rem", "9rem", "9rem", "9rem"]}
            shrinkZero
          />
        }
      >
        <LinkReportsTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LinkReportsTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = linkReportsSearchParamsCache.parse(await searchParams);
  const result = await getAdminLinkReportsTableData(search);
  return <AdminLinkReportsTable {...result} />;
}
