"use client";

import { readApiData } from "@/lib/api-response";

export type LinkReportReason =
  | "spam"
  | "malware"
  | "impersonation"
  | "copyright"
  | "adult"
  | "other";

export type CreateLinkReportInput = {
  email: string;
  reportedUrl: string;
  reason: LinkReportReason;
  details: string;
};

export async function createPublicLinkReport(input: CreateLinkReportInput) {
  const response = await fetch("/api/backend/public/link-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await readApiData<{
    reference?: string;
    createdAt?: string;
  }>(response);
  if (!payload?.reference) throw new Error("Phản hồi báo cáo không hợp lệ.");
  return { reference: payload.reference, createdAt: payload.createdAt ?? null };
}
