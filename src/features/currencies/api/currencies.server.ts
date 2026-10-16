import "server-only";

import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData, readPaginatedApiResponse } from "@/lib/api-response";

import type {
  AdminCurrenciesResponse,
  MemberCurrencyPreferences,
} from "../types";

export async function getAdminCurrencies() {
  const response = await serverApiFetch(
    "/admin/settings/currencies",
    { cache: "no-store" },
  );
  return readPaginatedApiResponse<AdminCurrenciesResponse["data"][number]>(response) as Promise<AdminCurrenciesResponse>;
}

export async function getMemberCurrencyPreferences() {
  const response = await serverApiFetch(
    "/member/preferences/currency",
    { cache: "no-store" },
  );
  return readApiData<MemberCurrencyPreferences>(response);
}
