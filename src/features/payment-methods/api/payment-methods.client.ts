import { authenticatedApiRequest, authenticatedPaginatedApiRequest } from "@/lib/api-client";

import type {
  MemberPaymentMethodsDashboard,
  PaymentMethod,
  PaymentMethodPayload,
  UserPaymentMethod,
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

export async function getAdminPaymentMethods() {
  return authenticatedPaginatedApiRequest<PaymentMethod>("/admin/payment-methods");
}

export async function getAdminPaymentMethod(id: number) {
  return request<PaymentMethod>(`/admin/payment-methods/${id}`);
}

export async function createAdminPaymentMethod(
  payload: PaymentMethodPayload,
) {
  return request<PaymentMethod>("/admin/payment-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAdminPaymentMethod(
  id: number,
  payload: PaymentMethodPayload,
) {
  return request<PaymentMethod>(`/admin/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminPaymentMethod(id: number) {
  return request<{ id: number; deleted: true }>(
    `/admin/payment-methods/${id}`,
    { method: "DELETE" },
  );
}

export async function getMemberPaymentMethods() {
  return request<MemberPaymentMethodsDashboard>("/member/payment-methods");
}

export async function createMemberPaymentMethod(
  paymentMethodId: number,
  details: Record<string, string>,
) {
  return request<UserPaymentMethod>("/member/payment-methods", {
    method: "POST",
    body: JSON.stringify({ paymentMethodId, details }),
  });
}

export async function updateMemberPaymentMethod(
  id: number,
  paymentMethodId: number,
  details: Record<string, string>,
) {
  return request<UserPaymentMethod>(`/member/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ paymentMethodId, details }),
  });
}

export async function deleteMemberPaymentMethod(id: number) {
  return request<{ id: number; deleted: true }>(
    `/member/payment-methods/${id}`,
    { method: "DELETE" },
  );
}
