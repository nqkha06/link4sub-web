"use client"

import { useTranslations } from "next-intl"
import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  deleteAdminSnippets,
  restoreAdminSnippets,
} from "@/features/admin-snippets/api/snippets.client"
import type { AdminSnippet } from "@/features/admin-snippets/types"

export type SnippetConfirmationAction =
  | { type: "delete"; snippets: AdminSnippet[] }
  | { type: "restore"; snippets: AdminSnippet[] }

export function SnippetActionDialog({
  action,
  onOpenChange,
  onSuccess,
}: {
  action: SnippetConfirmationAction | null
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.snippets.action")
  const tc = useTranslations("Admin.common")
  const [pending, setPending] = React.useState(false)
  const deleting = action?.type === "delete"
  const count = action?.snippets.length ?? 0

  async function confirm() {
    if (!action) return
    setPending(true)
    try {
      const ids = action.snippets.map((snippet) => snippet.id)
      if (action.type === "delete") {
        const result = await deleteAdminSnippets(ids)
        toast.success(t("deleted", { count: result.deleted }))
      } else {
        const result = await restoreAdminSnippets(ids)
        toast.success(t("restored", { count: result.restored }))
      }
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failed"),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={Boolean(action)}
      onOpenChange={(open) => !pending && onOpenChange(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deleting
              ? t("deleteTitle", { count })
              : t("restoreTitle", { count })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deleting
              ? t("deleteDescription")
              : t("restoreDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant={deleting ? "destructive" : "default"}
            disabled={pending}
            onClick={() => void confirm()}
          >
            {pending
              ? t("processing")
              : deleting
                ? t("moveToTrash")
                : t("restore")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
