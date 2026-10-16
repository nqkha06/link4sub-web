"use client";

import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

import type {
  CheatUserPreview,
  ConfirmImportResult,
  IpReputationDetail,
  IpReputationListResponse,
  WithdrawalScanResult,
} from "../types";

export async function getCheatUserPreview(userId: number) {
  return request<CheatUserPreview>(`/admin/ip-reputation/users/${userId}/preview`);
}

export async function confirmCheatUserImport(userId: number, ips?: string[]) {
  return request<ConfirmImportResult>(`/admin/ip-reputation/users/${userId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ips ? { ips } : {}),
  });
}

export async function getWithdrawalIpReputationScan(userId: number) {
  return request<WithdrawalScanResult>(`/admin/users/${userId}/ip-reputation-scan`);
}

export async function getIpReputationList(input: { page?: number; status?: "active" | "expired" }) {
  const query = new URLSearchParams();
  if (input.page) query.set("page", String(input.page));
  if (input.status) query.set("status", input.status);
  return authenticatedPaginatedApiRequest<IpReputationListResponse["data"][number]>(
    `/admin/ip-reputation?${query.toString()}`,
  );
}

export async function getIpReputationDetail(ip: string) {
  return request<IpReputationDetail>(`/admin/ip-reputation/detail?ip=${encodeURIComponent(ip)}`);
}

async function request<T>(path: string, init?: RequestInit) {
  return authenticatedApiRequest<T>(path, init);
}
