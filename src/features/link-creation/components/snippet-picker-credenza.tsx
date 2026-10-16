"use client"

import { useId, useMemo, useState } from "react"
import { Check, FileCode2, Loader2, Plus, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/member/fields/input"
import { Textarea } from "@/components/member/fields/textarea"
import type { SnippetDto } from "@/lib/api-client"
import { cn } from "@/lib/utils"

import { formatSnippetSize } from "../lib/media"

type SnippetPickerTab = "existing" | "create"

type SnippetPickerCredenzaProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  snippets: SnippetDto[]
  selectedId?: string
  isLoading?: boolean
  loadError?: string
  onRetry?: () => void
  onSelect: (snippet: SnippetDto) => void
  onCreate: (payload: { name?: string; content: string }) => Promise<SnippetDto>
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  return [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

export function SnippetPickerCredenza({
  open,
  onOpenChange,
  snippets,
  selectedId,
  isLoading = false,
  loadError,
  onRetry,
  onSelect,
  onCreate,
}: SnippetPickerCredenzaProps) {
  const t = useTranslations("CreateLink")
  const dialogId = useId()

  const [tab, setTab] = useState<SnippetPickerTab>("existing")
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const [draftId, setDraftId] = useState(selectedId ?? "")
  const [newName, setNewName] = useState("")
  const [newContent, setNewContent] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState("")
  const pageSize = 10

  const filteredSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return snippets

    return snippets.filter((snippet) =>
      [snippet.name, snippet.content]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [query, snippets])

  const totalPages = Math.max(1, Math.ceil(filteredSnippets.length / pageSize))
  const safePage = Math.min(Math.max(page, 1), totalPages)
  const firstVisibleSnippet = filteredSnippets.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const lastVisibleSnippet = Math.min(safePage * pageSize, filteredSnippets.length)
  const visiblePages = getVisiblePages(safePage, totalPages)
  const visibleSnippets = filteredSnippets.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )
  const activeDraftId = draftId || selectedId || ""
  const activeSnippet = snippets.find((snippet) => snippet.id === activeDraftId)

  function handlePickerOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftId(selectedId ?? "")
      setTab("existing")
      setPage(1)
      setFormError("")
    }

    onOpenChange(nextOpen)
  }

  function handleTabChange(nextTab: SnippetPickerTab) {
    setTab(nextTab)
    setFormError("")
  }

  async function handleCreate() {
    const content = newContent.trim()

    if (!content) {
      setFormError(t("snippetContentRequired"))
      return
    }

    try {
      setIsCreating(true)
      setFormError("")
      const created = await onCreate({
        name: newName.trim() || undefined,
        content,
      })

      setNewName("")
      setNewContent("")
      onSelect(created)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : t("snippetCreateFailed"))
    } finally {
      setIsCreating(false)
    }
  }

  const emptyState = (
    <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 text-center">
      <FileCode2 className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">
        {query ? t("noSnippetResults") : t("noSnippets")}
      </p>
    </div>
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={handlePickerOpenChange}>
      <ResponsiveDialogContent className="bg-background sm:h-[min(88dvh,860px)] sm:max-w-[960px]">
        <ResponsiveDialogHeader className="shrink-0 border-b border-border bg-card px-5 py-5 sm:px-7 sm:py-6">
          <ResponsiveDialogTitle className="text-xl font-semibold tracking-[-0.025em] sm:text-2xl">
            {t("snippetDialogTitle")}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0">
          <div
            role="tablist"
            aria-label={t("snippetDialogTitle")}
            className="flex h-14 w-full shrink-0 items-stretch gap-2 border-b border-border px-4 sm:px-6"
          >
            <button
              id={`${dialogId}-existing-tab`}
              type="button"
              role="tab"
              aria-selected={tab === "existing"}
              aria-controls={`${dialogId}-existing-panel`}
              onClick={() => handleTabChange("existing")}
              className={cn(
                "-mb-px inline-flex h-14 items-center gap-2 border-b-2 px-2 text-sm font-medium transition-colors sm:px-3",
                tab === "existing"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <FileCode2 className="size-4" aria-hidden />
              {t("useExisting")}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  tab === "existing"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {snippets.length}
              </span>
            </button>

            <button
              id={`${dialogId}-create-tab`}
              type="button"
              role="tab"
              aria-selected={tab === "create"}
              aria-controls={`${dialogId}-create-panel`}
              onClick={() => handleTabChange("create")}
              className={cn(
                "-mb-px inline-flex h-14 items-center gap-2 border-b-2 px-2 text-sm font-medium transition-colors sm:px-3",
                tab === "create"
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Plus className="size-4" aria-hidden />
              {t("createNew")}
            </button>
          </div>

          {tab === "existing" ? (
            <section
              id={`${dialogId}-existing-panel`}
              role="tabpanel"
              aria-labelledby={`${dialogId}-existing-tab`}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
                    placeholder={t("searchSnippets")}
                    aria-label={t("searchSnippets")}
                    className="pl-10 pr-10"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("")
                        setPage(1)
                      }}
                      aria-label={t("clearFilters")}
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {t("loading")}
                  </div>
                ) : loadError ? (
                  <div className="flex h-full min-h-48 flex-col items-center justify-center gap-3 px-6 text-center">
                    <p className="text-sm text-destructive">{loadError}</p>
                    {onRetry ? (
                      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                        {t("retry")}
                      </Button>
                    ) : null}
                  </div>
                ) : visibleSnippets.length === 0 ? (
                  emptyState
                ) : (
                  visibleSnippets.map((snippet) => {
                    const isSelected = activeDraftId === snippet.id

                    return (
                      <button
                        key={snippet.id}
                        type="button"
                        onClick={() => setDraftId(snippet.id)}
                        aria-pressed={isSelected}
                        data-selected={isSelected}
                        className="group flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-accent data-[selected=true]:bg-primary/[0.06] sm:gap-4 sm:px-6"
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-transparent group-hover:border-primary/40",
                          )}
                        >
                          <Check className="size-3" aria-hidden />
                        </span>
                        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted/30 text-muted-foreground">
                          <FileCode2 className="size-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {snippet.name || "—"}
                          </span>
                          <code className="mt-0.5 block truncate text-xs text-muted-foreground" title={snippet.content}>
                            {snippet.content}
                          </code>
                        </span>
                        <span className="shrink-0 text-right text-xs text-muted-foreground">
                          <span className="block tabular-nums">{formatSnippetSize(snippet.content)}</span>
                          <span className="mt-0.5 block whitespace-nowrap tabular-nums">{formatDate(snippet.createdAt)}</span>
                        </span>
                      </button>
                    )
                  })
                )}
              </div>

              {filteredSnippets.length > 0 && !isLoading && !loadError ? (
                <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {t("snippetRange", {
                      from: firstVisibleSnippet,
                      to: lastVisibleSnippet,
                      total: filteredSnippets.length,
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>
                      <span className="sr-only">{t("previousPage")}</span>
                      <span aria-hidden>‹</span>
                    </Button>
                    {visiblePages.map((pageNumber, index) => (
                      <div key={pageNumber} className="flex items-center gap-1">
                        {index > 0 && pageNumber - visiblePages[index - 1] > 1 ? (
                          <span className="px-1 text-muted-foreground">…</span>
                        ) : null}
                        <Button
                          type="button"
                          variant={pageNumber === safePage ? "default" : "ghost"}
                          size="icon-sm"
                          onClick={() => setPage(pageNumber)}
                          aria-current={pageNumber === safePage ? "page" : undefined}
                        >
                          {pageNumber}
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="icon-sm" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>
                      <span className="sr-only">{t("nextPage")}</span>
                      <span aria-hidden>›</span>
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : (
            <section
              id={`${dialogId}-create-panel`}
              role="tabpanel"
              aria-labelledby={`${dialogId}-create-tab`}
              className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
            >
              <div className="mx-auto max-w-3xl space-y-5">
                <div className="space-y-2">
                  <label htmlFor={`${dialogId}-name`} className="text-sm font-medium">
                    {t("snippetName")}
                  </label>
                  <Input
                    id={`${dialogId}-name`}
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder={t("snippetNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <label htmlFor={`${dialogId}-content`} className="text-sm font-medium">
                      {t("codeOrText")}
                    </label>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {t("characterCount", { count: newContent.length })}
                    </span>
                  </div>
                  <Textarea
                    id={`${dialogId}-content`}
                    value={newContent}
                    onChange={(event) => {
                      setNewContent(event.target.value)
                      if (formError) setFormError("")
                    }}
                    placeholder={t("snippetContentPlaceholder")}
                    className={cn(
                      "min-h-64 resize-y font-mono leading-relaxed",
                      formError && "border-destructive focus-visible:ring-destructive",
                    )}
                    aria-invalid={Boolean(formError)}
                  />
                  {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
                </div>
              </div>
            </section>
          )}
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="shrink-0 flex-col-reverse gap-3 border-border bg-card sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-muted-foreground">
            {tab === "existing" && activeSnippet ? (
              <p className="truncate">
                {t("selected")}: <span className="font-medium text-foreground">{activeSnippet.name || "—"}</span>
              </p>
            ) : null}
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9 rounded-lg shadow-none">
              {t("cancel")}
            </Button>
            {tab === "existing" ? (
              <Button
                type="button"
                disabled={!activeSnippet}
                onClick={() => {
                  if (activeSnippet) onSelect(activeSnippet)
                }}
                className="h-9 rounded-lg shadow-none"
              >
                {t("useSnippet")}
                {activeSnippet ? <Check className="size-3.5" aria-hidden /> : null}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={!newContent.trim() || isCreating}
                onClick={() => void handleCreate()}
                className="h-9 rounded-lg shadow-none"
              >
                {isCreating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
                {isCreating ? t("creating") : t("createAndUse")}
              </Button>
            )}
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
