import "server-only";

import type {
  AdminBusinessSettings,
  AdminRegistrationSettings,
  AdminWithdrawalSettings,
} from "../types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getAdminBusinessSettings() {
  const response = await serverApiFetch(
    "/admin/settings/business",
    { cache: "no-store" },
  );
  return readApiData<AdminBusinessSettings>(response);
}

export async function getAdminWithdrawalSettings() {
  const response = await serverApiFetch(
    "/admin/settings/withdrawals",
    { cache: "no-store" },
  );
  return readApiData<AdminWithdrawalSettings>(response);
}

export async function getAdminRegistrationSettings() {
  const response = await serverApiFetch(
    "/admin/settings/registration",
    { cache: "no-store" },
  );
  return readApiData<AdminRegistrationSettings>(response);
}
