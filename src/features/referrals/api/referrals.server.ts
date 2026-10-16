import "server-only";

import { headers } from "next/headers";

import type {
  ReferralsDashboard,
  ReferralsDashboardApiResponse,
} from "@/features/referrals/types";
import { serverApiFetch } from "@/lib/auth/server-api";
import { readApiData } from "@/lib/api-response";

export async function getReferralsDashboard(): Promise<ReferralsDashboard> {
  const response = await serverApiFetch(
    "/member/referrals/dashboard",
    { cache: "no-store" },
  );
  const data = await readApiData<ReferralsDashboardApiResponse>(response);
  return {
    ...data,
    referralUrl: new URL(data.referralPath, await requestOrigin()).toString(),
  };
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim();
  const host = forwardedHost || requestHeaders.get("host") || "localhost:3000";
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(host)
    ? host
    : "localhost:3000";
  const forwardedProto = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : safeHost.startsWith("localhost") || safeHost.startsWith("127.0.0.1")
        ? "http"
        : "https";
  return `${protocol}://${safeHost}`;
}
