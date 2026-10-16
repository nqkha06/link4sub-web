"use client";

import type {
  AdminBusinessSettings,
  AdminRegistrationSettings,
  AdminWithdrawalSettings,
} from "../types";
import { authenticatedApiFetch } from "@/lib/api-client";
import { readApiData } from "@/lib/api-response";

export type UpdateBusinessSettingsInput = Omit<
  AdminBusinessSettings,
  "updatedAt" | "currencies" | "uiLanguages"
>;

export async function updateBusinessSettings(values: UpdateBusinessSettingsInput) {
  const response = await authenticatedApiFetch("/admin/settings/business", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return readApiData<AdminBusinessSettings>(response);
}

export type UpdateWithdrawalSettingsInput = Pick<
  AdminWithdrawalSettings,
  | "withdrawalCurrencyCode"
  | "withdrawalsPaused"
  | "requireWithdrawalTrafficSource"
  | "fastWithdrawalEnabled"
  | "fastWithdrawalFeeRate"
>;

export async function updateWithdrawalSettings(
  values: UpdateWithdrawalSettingsInput,
) {
  const response = await authenticatedApiFetch("/admin/settings/withdrawals", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return readApiData<AdminWithdrawalSettings>(response);
}

export type UpdateRegistrationSettingsInput = Pick<
  AdminRegistrationSettings,
  | "signupBonusAmount"
  | "referralSignupBonusAmount"
  | "referrerSignupBonusAmount"
>;

export async function updateRegistrationSettings(
  values: UpdateRegistrationSettingsInput,
) {
  const response = await authenticatedApiFetch("/admin/settings/registration", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
  return readApiData<AdminRegistrationSettings>(response);
}
