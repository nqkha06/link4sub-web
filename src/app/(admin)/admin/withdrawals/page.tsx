import { Suspense } from "react";

import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  getAdminWithdrawalFilterOptions,
  getAdminWithdrawalsTableData,
} from "@/features/withdrawals/api/withdrawals.server";
import { AdminWithdrawalsTable } from "@/features/withdrawals/components/admin-withdrawals-table";
import { withdrawalsSearchParamsCache } from "@/features/withdrawals/query/withdrawals-search-params";

export const metadata: Metadata = { title: "Yêu cầu rút tiền" };

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("Admin.routes.withdrawals");

  return (
    <main className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-4 lg:px-6 lg:py-6">
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
      />
      <Suspense
        fallback={
          <DataTableSkeleton
            columnCount={9}
            filterCount={7}
            cellWidths={[
              "5rem",
              "18rem",
              "12rem",
              "10rem",
              "10rem",
              "11rem",
            ]}
            shrinkZero
          />
        }
      >
        <WithdrawalsTableLoader searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function WithdrawalsTableLoader({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const search = withdrawalsSearchParamsCache.parse(await searchParams);
  const [result, filterOptions] = await Promise.all([
    getAdminWithdrawalsTableData(search),
    getAdminWithdrawalFilterOptions(),
  ]);
  return (
    <AdminWithdrawalsTable
      {...result}
      filteredUserId={search.userId}
      filterOptions={filterOptions}
    />
  );
}
