"use client";

import { authenticatedApiRequest } from "@/lib/api-client";
import type { AdminSupportTicket } from "../types";
import type {
  SupportRequestStatus,
  SupportTicketPriority,
} from "@/components/dashboard/support/types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...Object.fromEntries(new Headers(init?.headers).entries()),
    },
  });
}

export function getAdminSupportTicket(id: number) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}`, {
    cache: "no-store",
  });
}

export function replyAdminSupportTicket(id: number, content: string) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateAdminSupportTicket(
  id: number,
  input: {
    status?: SupportRequestStatus;
    priority?: SupportTicketPriority;
    assignToMe?: boolean;
    unassign?: boolean;
  },
) {
  return request<AdminSupportTicket>(`/admin/support/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
