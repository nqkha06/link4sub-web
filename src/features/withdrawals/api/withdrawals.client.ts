import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

import type {
  AdminWithdrawal,
  BulkWithdrawalActionResult,
  WithdrawalStatus,
} from "../types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

export function getAdminWithdrawals(input: {
  status?: WithdrawalStatus;
  search?: string;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (input.status) params.set("status", input.status);
  if (input.search) params.set("search", input.search);
  params.set("page", String(input.page ?? 1));
  params.set("perPage", "20");
  return authenticatedPaginatedApiRequest<AdminWithdrawal>(
    `/admin/withdrawals?${params.toString()}`,
  );
}

export function getAdminWithdrawal(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}`);
}

export function processAdminWithdrawal(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/process`, {
    method: "PATCH",
  });
}

export function markAdminWithdrawalPaid(id: number) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/paid`, {
    method: "PATCH",
  });
}

export function rejectAdminWithdrawal(id: number, statusReason: string) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ statusReason }),
  });
}

export function updateAdminWithdrawalPaymentInfo(
  id: number,
  input: { paymentMethodName: string; details: Record<string, string> },
) {
  return request<AdminWithdrawal>(`/admin/withdrawals/${id}/payment-info`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function bulkProcessAdminWithdrawals(ids: number[]) {
  return request<BulkWithdrawalActionResult>(
    "/admin/withdrawals/bulk/process",
    {
      method: "PATCH",
      body: JSON.stringify({ ids }),
    },
  );
}

export function bulkMarkAdminWithdrawalsPaid(ids: number[]) {
  return request<BulkWithdrawalActionResult>("/admin/withdrawals/bulk/paid", {
    method: "PATCH",
    body: JSON.stringify({ ids }),
  });
}

export function bulkRejectAdminWithdrawals(
  ids: number[],
  statusReason: string,
) {
  return request<BulkWithdrawalActionResult>(
    "/admin/withdrawals/bulk/reject",
    {
      method: "PATCH",
      body: JSON.stringify({ ids, statusReason }),
    },
  );
}
