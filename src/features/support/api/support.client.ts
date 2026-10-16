"use client";

import type {
  CreateSupportRequestInput,
  SupportRequest,
} from "@/components/dashboard/support/types";
import { authenticatedApiRequest } from "@/lib/api-client";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return authenticatedApiRequest<T>(path, init);
}

export function getMemberSupportTickets() {
  return request<SupportRequest[]>("/member/support/tickets", {
    cache: "no-store",
  });
}

export function getMemberSupportTicket(id: number) {
  return request<SupportRequest>(`/member/support/tickets/${id}`, {
    cache: "no-store",
  });
}

export function createMemberSupportTicket(input: CreateSupportRequestInput) {
  const form = new FormData();
  form.set("category", input.category);
  form.set("subject", input.subject);
  form.set("content", input.content);
  if (input.relatedResource && input.relatedResource !== "none") {
    form.set("relatedResource", input.relatedResource);
  }
  if (input.attachTechnicalInfo) {
    form.set(
      "technicalInfo",
      JSON.stringify({
        route: window.location.pathname,
        userAgent: navigator.userAgent,
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        capturedAt: new Date().toISOString(),
      }),
    );
  }
  input.attachments.forEach((file) => form.append("attachments", file));
  return request<SupportRequest>("/member/support/tickets", {
    method: "POST",
    body: form,
  });
}

export function replyMemberSupportTicket(id: number, content: string) {
  return request<SupportRequest>(`/member/support/tickets/${id}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
}
