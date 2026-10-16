"use client"

import { Check, Loader2, Search, UserRound } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import * as React from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import {
  createAdminSnippet,
  searchAdminSnippetOwners,
} from "@/features/admin-snippets/api/snippets.client"
import type { AdminSnippetOwner } from "@/features/admin-snippets/types"

export function SnippetCreateDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const t = useTranslations("Admin.snippets.create")
  const tc = useTranslations("Admin.common")
  const locale = useLocale()
  const [ownerSearch, setOwnerSearch] = React.useState("")
  const [owners, setOwners] = React.useState<AdminSnippetOwner[]>([])
  const [selectedOwner, setSelectedOwner] =
    React.useState<AdminSnippetOwner | null>(null)
  const [name, setName] = React.useState("")
  const [content, setContent] = React.useState("")
  const [loadingOwners, setLoadingOwners] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    let active = true
    const timeout = window.setTimeout(async () => {
      setLoadingOwners(true)
      try {
        const result = await searchAdminSnippetOwners(ownerSearch)
        if (active) setOwners(result)
      } catch (error) {
        if (active) {
          toast.error(
            error instanceof Error
              ? error.message
              : t("ownersLoadFailed"),
          )
        }
      } finally {
        if (active) setLoadingOwners(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [open, ownerSearch, t])

  function close() {
    if (pending) return
    resetForm()
    onOpenChange(false)
  }

  function resetForm() {
    setOwnerSearch("")
    setOwners([])
    setSelectedOwner(null)
    setName("")
    setContent("")
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOwner || !content.trim()) return
    setPending(true)
    try {
      await createAdminSnippet({
        userId: selectedOwner.id,
        ...(name.trim() ? { name: name.trim() } : {}),
        content: content.trim(),
      })
      toast.success(t("created"))
      resetForm()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("createFailed"),
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>{t("owner")}</Label>
            {selectedOwner ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <OwnerIdentity owner={selectedOwner} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setSelectedOwner(null)}
                >
                  {t("changeOwner")}
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <div className="relative border-b">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder={t("ownerSearchPlaceholder")}
                    className="rounded-none border-0 pl-9 shadow-none focus-visible:ring-0"
                    aria-label={t("ownerSearchAria")}
                  />
                </div>
                <ScrollArea className="h-44">
                  <div className="p-1">
                    {loadingOwners ? (
                      <div className="flex h-36 items-center justify-center text-muted-foreground text-sm">
                        <Loader2 className="mr-2 size-4 animate-spin" /> {tc("loading")}
                      </div>
                    ) : owners.length ? (
                      owners.map((owner) => (
                        <button
                          key={owner.id}
                          type="button"
                          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-muted"
                          onClick={() => setSelectedOwner(owner)}
                        >
                          <OwnerIdentity owner={owner} />
                          <Check className="ml-auto hidden size-4" />
                        </button>
                      ))
                    ) : (
                      <div className="flex h-36 items-center justify-center text-muted-foreground text-sm">
                        {t("noOwners")}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-admin-snippet-name">{t("nameLabel")}</Label>
            <Input
              id="create-admin-snippet-name"
              value={name}
              maxLength={120}
              disabled={pending}
              placeholder={t("namePlaceholder")}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="create-admin-snippet-content">{t("contentLabel")}</Label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {t("charCounter", {
                  count: new Intl.NumberFormat(locale).format(content.length),
                  max: new Intl.NumberFormat(locale).format(100_000),
                })}
              </span>
            </div>
            <Textarea
              id="create-admin-snippet-content"
              value={content}
              maxLength={100_000}
              disabled={pending}
              className="min-h-64 resize-y font-mono text-xs leading-6"
              onChange={(event) => setContent(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" disabled={pending} onClick={close}>
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending || !selectedOwner || !content.trim()}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              {t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OwnerIdentity({ owner }: { owner: AdminSnippetOwner }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar className="size-8 border">
        <AvatarImage src={owner.avatar ?? undefined} alt={owner.name} />
        <AvatarFallback className="text-xs">
          {owner.name.slice(0, 2).toUpperCase() || <UserRound className="size-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm">{owner.name}</p>
        <p className="truncate text-muted-foreground text-xs">{owner.email}</p>
      </div>
    </div>
  )
}
