import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { getAdminBioPagesTableData } from "@/features/admin-bio-pages/api/admin-bio-pages.server";
import { AdminBioPagesTable } from "@/features/admin-bio-pages/components/admin-bio-pages-table";
import { bioPagesSearchParamsCache } from "@/features/admin-bio-pages/query/bio-pages-search-params";
import { requireAdmin } from "@/lib/auth/server-access";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Trang Link-in-bio" };

export default async function AdminBioPagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.routes.bioPages");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("bio-pages.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={7}
            filterCount={2}
            cellWidths={["18rem", "13rem", "8rem", "6rem", "6rem", "9rem"]}
            shrinkZero
          />
        }
      >
        <BioPagesTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function BioPagesTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = bioPagesSearchParamsCache.parse(await searchParams);
  const result = await getAdminBioPagesTableData(search);
  return <AdminBioPagesTable {...result} />;
}
