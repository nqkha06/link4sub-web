import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { getAdminAnnouncementsTableData } from "@/features/announcements/api/announcements.server";
import { AdminAnnouncementsTable } from "@/features/announcements/components/admin-announcements-table";
import { announcementsSearchParamsCache } from "@/features/announcements/query/announcements-search-params";
import { requireAdmin } from "@/lib/auth/server-access";

type SearchParams = Record<string, string | string[] | undefined>;

export const metadata: Metadata = { title: "Thông báo" };

export default async function AnnouncementsAdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.announcements.list");
  const { currentUser } = await requireAdmin();
  const canCreate = currentUser.permissions?.includes("announcements.create");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/admin/announcements/create">
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
            filterCount={6}
            cellWidths={["18rem", "8rem", "9rem", "7rem", "8rem", "9rem", "13rem", "9rem"]}
            shrinkZero
          />
        }
      >
        <AnnouncementsTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AnnouncementsTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = announcementsSearchParamsCache.parse(await searchParams);
  const result = await getAdminAnnouncementsTableData(search);
  return <AdminAnnouncementsTable {...result} />;
}
