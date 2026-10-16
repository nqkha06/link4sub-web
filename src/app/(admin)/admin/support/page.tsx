import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { getAdminSupportTableData } from "@/features/admin-support/api/admin-support.server";
import { AdminSupportTable } from "@/features/admin-support/components/admin-support-table";
import { supportSearchParamsCache } from "@/features/admin-support/query/support-search-params";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Hỗ trợ thành viên" };

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.routes.support");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            filterCount={5}
            cellWidths={["18rem", "12rem", "9rem", "9rem", "7rem", "9rem", "9rem"]}
            shrinkZero
          />
        }
      >
        <SupportTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SupportTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = supportSearchParamsCache.parse(await searchParams);
  const result = await getAdminSupportTableData(search);
  return <AdminSupportTable {...result} />;
}
