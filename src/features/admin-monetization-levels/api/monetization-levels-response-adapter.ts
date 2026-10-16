import type {
  MonetizationLevelsTableData,
  MonetizationLevelsResponse,
} from "@/features/admin-monetization-levels/types";

export function adaptMonetizationLevelsResponse(
  response: MonetizationLevelsResponse,
): MonetizationLevelsTableData {
  return {
    data: response.data,
    pageCount: response.meta.totalPages,
    total: response.meta.total,
    summary: response.meta.summary,
  };
}
