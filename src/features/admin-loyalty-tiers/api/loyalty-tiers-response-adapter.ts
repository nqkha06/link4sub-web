import type {
  LoyaltyTiersTableData,
  LoyaltyTiersResponse,
} from "@/features/admin-loyalty-tiers/types";

export function adaptLoyaltyTiersResponse(
  response: LoyaltyTiersResponse,
): LoyaltyTiersTableData {
  return {
    data: response.data,
    pageCount: response.meta.totalPages,
    total: response.meta.total,
    summary: response.meta.summary,
  };
}
