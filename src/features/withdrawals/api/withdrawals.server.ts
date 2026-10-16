import "server-only";

import { serializeWithdrawalsTableQuery } from "@/features/withdrawals/api/withdrawals-query-serializer";
import type { WithdrawalsTableQuery } from "@/features/withdrawals/query/withdrawals-search-params";
import type {
  AdminWithdrawalFilterOptions,
  AdminWithdrawalsResponse,
  AdminWithdrawalsTableData,
} from "@/features/withdrawals/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

export async function getAdminWithdrawalsTableData(
  state: WithdrawalsTableQuery,
): Promise<AdminWithdrawalsTableData> {
  const response = await serverApiFetch(
    `/admin/withdrawals?${serializeWithdrawalsTableQuery(state)}`,
    { cache: "no-store" },
  );

  const result = await readPaginatedApiResponse<AdminWithdrawalsResponse["data"][number]>(response);
  return {
    data: result.data,
    total: result.meta.total,
    pageCount: result.meta.totalPages,
  };
}

/** Giá trị cho các bộ lọc dạng chọn; lỗi thì trả rỗng để bảng vẫn dùng được. */
export async function getAdminWithdrawalFilterOptions(): Promise<AdminWithdrawalFilterOptions> {
  const response = await serverApiFetch(
    "/admin/withdrawals/filter-options",
    { cache: "no-store" },
  );
  if (!response.ok) return { paymentMethods: [] };
  const result = await readApiData<Partial<AdminWithdrawalFilterOptions>>(response);
  return { paymentMethods: result.paymentMethods ?? [] };
}
