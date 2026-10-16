import "server-only";

import { redirect } from "next/navigation";

import { getServerUser } from "@/lib/auth/server-session";

export async function requireMember(callbackUrl = "/member") {
  const currentUser = await getServerUser({
    callbackUrl,
    mode: "required",
  });
  return { currentUser };
}

export async function requirePermission(
  permission: string,
  callbackUrl: string,
) {
  const context = await requireMember(callbackUrl);
  if (!context.currentUser.permissions.includes(permission)) {
    redirect("/member");
  }
  return context;
}

export function requireAdmin(callbackUrl = "/admin") {
  return requirePermission("admin.access", callbackUrl);
}
