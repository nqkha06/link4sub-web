"use client"

import { Search, UserRound, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { parseAsInteger, useQueryStates } from "nuqs"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { socialLinksQuickFilterParsers } from "@/features/admin-social-links/query/social-links-search-params"
import { useDebouncedCallback } from "@/hooks/use-debounced-callback"
import { cn } from "@/lib/utils"

const ALL = "__all__"
const MULTIPLE = "__multiple__"

/**
 * Thanh lọc nhanh luôn hiển thị: gõ để tìm theo tiêu đề/alias và chủ sở hữu,
 * chọn nhanh trạng thái, nguồn, loại đích, phạm vi. Ghi thẳng lên URL (cùng
 * tham số server đã hỗ trợ), kết hợp được với bộ lọc nâng cao bên dưới.
 */
export function SocialLinksQuickFilters({ className }: { className?: string }) {
  const t = useTranslations("Admin.socialLinks")
  const tq = useTranslations("Admin.socialLinks.table.quickFilters")
  const tc = useTranslations("Admin.common")

  const [values, setValues] = useQueryStates(
    { ...socialLinksQuickFilterParsers, page: parseAsInteger },
    { shallow: false, clearOnDefault: true },
  )

  // Mọi thay đổi bộ lọc đều quay về trang 1.
  const update = React.useCallback(
    (patch: Partial<Omit<typeof values, "page">>) => {
      void setValues({ ...patch, page: null })
    },
    [setValues],
  )

  const scope =
    values.deletedState.length === 1 ? values.deletedState[0] : ALL
  const isActive =
    Boolean(values.title) ||
    Boolean(values.owner) ||
    values.status.length > 0 ||
    values.source.length > 0 ||
    values.destinationType.length > 0 ||
    scope !== "active"

  return (
    <div
      className={cn(
        "grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_repeat(4,minmax(0,1fr))_auto]",
        className,
      )}
    >
      <DebouncedSearchInput
        icon={Search}
        value={values.title}
        placeholder={tq("titlePlaceholder")}
        ariaLabel={tq("titleAria")}
        clearLabel={tq("clearInput")}
        onCommit={(title) => update({ title })}
        className="lg:col-span-2 2xl:col-span-1"
      />
      <DebouncedSearchInput
        icon={UserRound}
        value={values.owner}
        placeholder={tq("ownerPlaceholder")}
        ariaLabel={tq("ownerAria")}
        clearLabel={tq("clearInput")}
        onCommit={(owner) => update({ owner })}
        className="lg:col-span-2 2xl:col-span-1"
      />

      <QuickSelect
        ariaLabel={tq("status")}
        allLabel={tq("allStatuses")}
        multipleLabel={tq("multiple")}
        value={values.status}
        options={[
          { value: "active", label: tc("active") },
          { value: "inactive", label: tc("inactive") },
          { value: "paused", label: t("status.paused") },
        ]}
        onChange={(status) => update({ status })}
      />
      <QuickSelect
        ariaLabel={tq("source")}
        allLabel={tq("allSources")}
        multipleLabel={tq("multiple")}
        value={values.source}
        options={[
          { value: "web", label: t("source.web") },
          { value: "api", label: t("source.api") },
        ]}
        onChange={(source) => update({ source })}
      />
      <QuickSelect
        ariaLabel={tq("destinationType")}
        allLabel={tq("allDestinationTypes")}
        multipleLabel={tq("multiple")}
        value={values.destinationType}
        options={[
          { value: "url", label: tq("destinationTypes.url") },
          { value: "file", label: tq("destinationTypes.file") },
          { value: "snippet", label: tq("destinationTypes.snippet") },
        ]}
        onChange={(destinationType) => update({ destinationType })}
      />

      <Select
        value={scope}
        onValueChange={(next) =>
          update({
            deletedState:
              next === ALL
                ? ["active", "deleted"]
                : [next as "active" | "deleted"],
          })
        }
      >
        <SelectTrigger
          aria-label={tq("scope")}
          className={cn("w-full", scope !== "active" && "border-primary/40 bg-primary/5")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">{t("table.scope.active")}</SelectItem>
          <SelectItem value="deleted">{t("table.scope.trash")}</SelectItem>
          <SelectItem value={ALL}>{tq("scopeAll")}</SelectItem>
        </SelectContent>
      </Select>

      {isActive ? (
        <Button
          type="button"
          variant="ghost"
          className="text-muted-foreground sm:col-span-2 sm:justify-self-start lg:col-span-4 2xl:col-span-1"
          onClick={() =>
            void setValues({
              title: null,
              owner: null,
              status: null,
              source: null,
              destinationType: null,
              deletedState: null,
              page: null,
            })
          }
        >
          <X /> {tq("clear")}
        </Button>
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function DebouncedSearchInput({
  icon: Icon,
  value,
  placeholder,
  ariaLabel,
  clearLabel,
  onCommit,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
  placeholder: string
  ariaLabel: string
  clearLabel: string
  onCommit: (next: string) => void
  className?: string
}) {
  const [draft, setDraft] = React.useState(value)
  const [syncedValue, setSyncedValue] = React.useState(value)

  // URL đổi từ bên ngoài (nút xóa bộ lọc, quay lại trang trước...) thì cập
  // nhật ô nhập; bỏ qua khi URL chỉ vừa bắt kịp nội dung đang gõ.
  if (value !== syncedValue) {
    setSyncedValue(value)
    if (value !== draft.trim()) setDraft(value)
  }

  const commit = useDebouncedCallback((next: string) => {
    if (next !== value) onCommit(next)
  }, 350)

  return (
    <div className={cn("relative min-w-0", className)}>
      <Icon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={draft}
        maxLength={100}
        onChange={(event) => {
          setDraft(event.target.value)
          commit(event.target.value.trim())
        }}
        onKeyDown={(event) => {
          // Enter: áp dụng ngay, không chờ debounce.
          if (event.key === "Enter") {
            event.preventDefault()
            const next = draft.trim()
            if (next !== value) onCommit(next)
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          "pl-8 [&::-webkit-search-cancel-button]:hidden",
          draft && "pr-8",
          value && "border-primary/40 bg-primary/5",
        )}
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-0.5 -translate-y-1/2"
          aria-label={clearLabel}
          onClick={() => {
            setDraft("")
            commit("")
            if (value) onCommit("")
          }}
        >
          <X />
        </Button>
      ) : null}
    </div>
  )
}

function QuickSelect<T extends string>({
  ariaLabel,
  allLabel,
  multipleLabel,
  value,
  options,
  onChange,
}: {
  ariaLabel: string
  allLabel: string
  multipleLabel: string
  value: T[]
  options: { value: T; label: string }[]
  onChange: (next: T[]) => void
}) {
  // URL có thể chứa nhiều giá trị (link cũ/chia sẻ) — hiển thị "Nhiều giá trị"
  // thay vì âm thầm bỏ bớt.
  const selected =
    value.length === 0 ? ALL : value.length === 1 ? value[0] : MULTIPLE

  return (
    <Select
      value={selected}
      onValueChange={(next) => {
        if (next === MULTIPLE) return
        onChange(next === ALL ? [] : [next as T])
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full", value.length > 0 && "border-primary/40 bg-primary/5")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {selected === MULTIPLE ? (
          <SelectItem value={MULTIPLE} disabled>
            {multipleLabel}
          </SelectItem>
        ) : null}
      </SelectContent>
    </Select>
  )
}
