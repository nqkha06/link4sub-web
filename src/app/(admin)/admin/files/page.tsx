import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { getAdminMemberFilesTableData } from "@/features/admin-member-files/api/admin-member-files.server";
import { AdminMemberFilesTable } from "@/features/admin-member-files/components/admin-member-files-table";
import { memberFilesSearchParamsCache } from "@/features/admin-member-files/query/member-files-search-params";
import { requireAdmin } from "@/lib/auth/server-access";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Tệp thành viên" };

export default async function AdminMemberFilesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.routes.memberFiles");
  const { currentUser } = await requireAdmin();
  if (!currentUser.permissions.includes("member-files.read")) redirect("/admin");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader title={t("title")} description={t("description")} />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={8}
            filterCount={3}
            cellWidths={["2.5rem", "20rem", "13rem", "7rem", "6rem", "6rem", "9rem", "3rem"]}
            shrinkZero
          />
        }
      >
        <MemberFilesTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MemberFilesTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = memberFilesSearchParamsCache.parse(await searchParams);
  const result = await getAdminMemberFilesTableData(search);
  return <AdminMemberFilesTable {...result} filteredUserId={search.userId} />;
}
