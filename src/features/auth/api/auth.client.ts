"use client";

import type { AuthUser } from "@/features/auth/types";
import {
  getApiError,
  getApiErrorMessage,
  readApiData,
  readApiResponse,
} from "@/lib/api-response";

const authApiBase = "/api/backend/auth";

export function loginAccount(payload: {
  email: string;
  password: string;
  rememberMe: boolean;
}) {
  return request(`${authApiBase}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
}) {
  return requestJson<{ requiresEmailVerification: boolean }>(`${authApiBase}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(token: string) {
  return requestJson<{ message: string }>(`${authApiBase}/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

export async function resendEmailVerification(email: string) {
  return requestJson<{ message: string }>(`${authApiBase}/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export function loginWithGoogle(payload: {
  idToken: string;
  referralCode?: string;
  rememberMe: boolean;
}) {
  return request(`${authApiBase}/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function requestPasswordReset(payload: { email: string }) {
  const response = await fetch(`${authApiBase}/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiResponse<unknown>(response);
}

export async function resetPassword(payload: {
  token: string;
  password: string;
}) {
  const response = await fetch(`${authApiBase}/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiResponse<unknown>(response);
}

export class AuthClientError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AuthClientError";
  }
}

export async function changeAccountPassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await fetch(`${authApiBase}/change-password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  try {
    return await readApiData<{ message: string }>(response);
  } catch (error) {
    throw new AuthClientError(
      getApiErrorMessage(error),
      getApiError(error)?.error?.code,
    );
  }
}

export async function updateAccountProfile(payload: {
  name: string;
  avatar?: File;
  removeAvatar?: boolean;
}) {
  const body = new FormData();
  body.append("name", payload.name.trim());
  if (payload.avatar) body.append("avatar", payload.avatar);
  if (payload.removeAvatar) body.append("removeAvatar", "true");

  const response = await fetch(`${authApiBase}/me`, {
    method: "PATCH",
    credentials: "include",
    body,
  });
  return readApiData<AuthUser>(response);
}

export async function logoutAccount() {
  const response = await fetch(`${authApiBase}/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok && response.status !== 401) {
    await readApiResponse<never>(response);
  }
}

export async function logoutAndRedirect(callbackUrl = "/login") {
  try {
    await logoutAccount();
  } finally {
    window.location.assign(callbackUrl);
  }
}

export async function stopImpersonatingAndRedirect() {
  const response = await fetch(`${authApiBase}/impersonation/stop`, {
    method: "POST",
    credentials: "include",
  });
  await readApiData<unknown>(response);
  window.location.assign("/admin");
}

async function request(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  await readApiResponse<unknown>(response);
}

async function requestJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, credentials: "include" });
  return readApiData<T>(response);
}
