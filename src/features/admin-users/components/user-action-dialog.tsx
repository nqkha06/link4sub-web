"use client";

import { useTranslations } from "next-intl";
import * as React from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  deleteAdminUsers,
  impersonateAdminUser,
  revokeAdminUserSessions,
} from "@/features/admin-users/api/users.client";
import type { AdminUserListItem } from "@/features/admin-users/types";

export type UserConfirmationAction =
  | { type: "delete"; users: AdminUserListItem[] }
  | { type: "revoke-sessions"; users: [AdminUserListItem] }
  | { type: "impersonate"; users: [AdminUserListItem] };

export function UserActionDialog({
  action,
  onOpenChange,
  onSuccess,
}: {
  action: UserConfirmationAction | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("Admin.users");
  const tc = useTranslations("Admin.common");
  const [pending, setPending] = React.useState(false);
  const content = action ? getContent(action, t) : null;

  async function confirm() {
    if (!action) return;
    setPending(true);
    try {
      if (action.type === "delete") {
        const result = await deleteAdminUsers(
          action.users.map((user) => user.id),
        );
        toast.success(t("actionDialog.toast.deleted", { count: result.deleted }));
      } else if (action.type === "revoke-sessions") {
        const result = await revokeAdminUserSessions(action.users[0].id);
        toast.success(
          t("actionDialog.toast.revoked", { count: result.revokedSessions }),
        );
      } else {
        await impersonateAdminUser(action.users[0].id);
        return;
      }
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("actionDialog.toast.failed"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={Boolean(action)}
      onOpenChange={(open) => !pending && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content?.title}</AlertDialogTitle>
          <AlertDialogDescription>{content?.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>
            {tc("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant={action?.type === "delete" ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending ? t("actionDialog.processing") : content?.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getContent(
  action: UserConfirmationAction,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  if (action.type === "delete") {
    return {
      title: t("actionDialog.delete.title", { count: action.users.length }),
      description: t("actionDialog.delete.description"),
      confirm: t("actionDialog.delete.confirm"),
    };
  }
  const user = action.users[0];
  if (action.type === "impersonate") {
    return {
      title: t("actionDialog.impersonate.title", { name: user.name }),
      description: t("actionDialog.impersonate.description"),
      confirm: t("actionDialog.impersonate.confirm"),
    };
  }
  return {
    title: t("actionDialog.revoke.title"),
    description: t("actionDialog.revoke.description", { name: user.name }),
    confirm: t("actionDialog.revoke.confirm"),
  };
}
