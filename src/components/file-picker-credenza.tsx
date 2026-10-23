"use client"

import {
  useId,
  useMemo,
  useState,
  type ChangeEvent,
  type DragEvent,
  type ReactNode,
} from "react"
import {
  ArrowDownUp,
  Check,
  File,
  FileText,
  FolderOpen,
  ImageIcon,
  Loader2,
  Search,
  UploadCloud,
  Video,
  X,
} from "lucide-react"

import { FileTypeIcon } from "@/components/file-type-icon"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/member/fields/input"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/member/fields/select"
import { getFilePreviewUrl, type ManagedFileDto } from "@/lib/api-client"

export type FilePickerMode = "destination" | "cover" | "background"

type FileKind = "image" | "video" | "document" | "other"
type FileKindFilter = "all" | FileKind
type FileSort = "newest" | "oldest" | "name" | "size"
type FilePickerTab = "files" | "uploads"

type FilePickerLabels = {
  action: string
  close: string
  empty: string
  loading: string
  name: string
  select: string
  size: string
  uploaded: string
  search?: string
  allTypes?: string
  images?: string
  videos?: string
  documents?: string
  other?: string
  newest?: string
  oldest?: string
  nameSort?: string
  sizeSort?: string
  noResults?: string
  clearSearch?: string
  preview?: string
  previous?: string
  next?: string
  dragHint?: string
  browseHint?: string
  fileCount?: (count: number) => string
  selectedLabel?: string
  rangeLabel?: (from: number, to: number, total: number) => string
  filesTab?: string
  uploadsTab?: string
}

type FilePickerUpload = {
  accept?: string
  isUploading: boolean
  label: string
  progress?: number
  uploadingLabel: string
  multiple?: boolean
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  onFiles?: (files: File[]) => void | Promise<void>
}

type FilePickerCredenzaProps = {
  description?: string
  error?: string
  files: ManagedFileDto[]
  footer?: ReactNode
  isLoading: boolean
  labels: FilePickerLabels
  mode?: FilePickerMode
  onOpenChange: (open: boolean) => void
  onSelect: (file: ManagedFileDto) => void
  open: boolean
  selectedFileId?: string
  title: string
  upload?: FilePickerUpload
}

function getFileKind(file: ManagedFileDto): FileKind {
  if (file.mimeType.startsWith("image/")) return "image"
  if (file.mimeType.startsWith("video/")) return "video"

  const documentMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "text/",
  ]

  return documentMimeTypes.some((mimeType) => file.mimeType.startsWith(mimeType))
    ? "document"
    : "other"
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  return [...new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

function FileThumbnail({ file }: { file: ManagedFileDto }) {
  if (getFileKind(file) === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getFilePreviewUrl(file)}
        alt=""
        className="size-10 shrink-0 rounded-lg border border-border bg-muted/30 object-cover"
      />
    )
  }

  return (
    <FileTypeIcon file={file} />
  )
}

export function FilePickerCredenza({
  description,
  error,
  files,
  footer,
  isLoading,
  labels,
  mode = "destination",
  onOpenChange,
  onSelect,
  open,
  selectedFileId,
  title,
  upload,
}: FilePickerCredenzaProps) {
  const inputId = useId()
  const [activeTab, setActiveTab] = useState<FilePickerTab>("files")
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<FileKindFilter>("all")
  const [sort, setSort] = useState<FileSort>("newest")
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [pendingFileId, setPendingFileId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const filteredFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const result = files.filter((file) => {
      if (kind !== "all" && getFileKind(file) !== kind) return false
      if (!normalizedQuery) return true

      return [file.name, file.originalName, file.alias, file.extension, file.mimeType]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery))
    })

    return [...result].sort((a, b) => {
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "size") return b.size - a.size
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [files, kind, query, sort])

  const activeFileId = pendingFileId ?? selectedFileId ?? null
  const pendingFile = files.find((file) => file.id === activeFileId)
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paginatedFiles = filteredFiles.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstVisibleFile = filteredFiles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const lastVisibleFile = Math.min(currentPage * pageSize, filteredFiles.length)
  const visiblePages = getVisiblePages(currentPage, totalPages)
  const uploadProgress = upload?.progress === undefined
    ? null
    : Math.min(100, Math.max(0, Math.round(upload.progress)))

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    if (!upload?.onFiles || upload.isUploading) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
    setIsDragging(true)
  }

  function handleOpenChange(nextOpen: boolean) {
    setIsDragging(false)
    if (nextOpen) setActiveTab("files")
    if (!nextOpen) setPendingFileId(null)
    onOpenChange(nextOpen)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    if (!upload?.onFiles || upload.isUploading) return
    event.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(event.dataTransfer.files)
    const acceptedFiles = upload.multiple ? droppedFiles : droppedFiles.slice(0, 1)
    if (acceptedFiles.length > 0) void upload.onFiles(acceptedFiles)
  }

  function handleSelectFile(file: ManagedFileDto) {
    setPendingFileId(file.id)
  }

  function handleConfirmSelection() {
    if (pendingFile) {
      onSelect(pendingFile)
      setPendingFileId(null)
    }
  }

  const emptyContent = query || kind !== "all" ? (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <Search className="size-5 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-medium text-foreground">{labels.noResults || "No matching files"}</p>
      <button
        type="button"
        onClick={() => {
          setQuery("")
          setKind("all")
          setPage(1)
        }}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        {labels.clearSearch || "Clear filters"}
      </button>
    </div>
  ) : (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-xl border border-border bg-muted/30 text-muted-foreground">
        <FolderOpen className="size-5" aria-hidden />
      </span>
      <p className="mt-3 max-w-xs text-sm text-muted-foreground">{labels.empty}</p>
    </div>
  )

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="bg-background sm:h-[min(88dvh,860px)] sm:max-w-[960px]">
        <ResponsiveDialogHeader className="shrink-0 border-b border-border bg-card px-5 py-5 sm:px-7 sm:py-6">
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 pb-0">
          {error ? (
            <div className="shrink-0 px-4 pt-4 sm:px-6">
              <Alert variant="destructive" className="rounded-lg">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col">
            <div role="tablist" aria-label={title} className="flex h-14 w-full shrink-0 items-stretch gap-2 border-b border-border px-4 sm:px-6">
              <button
                id={`${inputId}-files-tab`}
                type="button"
                role="tab"
                aria-selected={activeTab === "files"}
                aria-controls={`${inputId}-files-panel`}
                onClick={() => setActiveTab("files")}
                className={`-mb-px inline-flex h-14 items-center gap-2 border-b-2 px-2 text-sm font-medium transition-colors sm:px-3 ${
                  activeTab === "files"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderOpen className="size-4" />
                {labels.filesTab || "Files"}
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${activeTab === "files" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {files.length}
                </span>
              </button>
              <button
                id={`${inputId}-uploads-tab`}
                type="button"
                role="tab"
                aria-selected={activeTab === "uploads"}
                aria-controls={`${inputId}-uploads-panel`}
                disabled={!upload}
                onClick={() => setActiveTab("uploads")}
                className={`-mb-px inline-flex h-14 items-center gap-2 border-b-2 px-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 sm:px-3 ${
                  activeTab === "uploads"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <UploadCloud className="size-4" />
                {labels.uploadsTab || "Uploads"}
              </button>
            </div>

            {activeTab === "files" ? (
            <section
              id={`${inputId}-files-panel`}
              role="tabpanel"
              aria-labelledby={`${inputId}-files-tab`}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="shrink-0 space-y-3 border-b border-border px-4 py-4 sm:px-6">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setPage(1)
                    }}
                    placeholder={labels.search || "Search files"}
                    aria-label={labels.search || "Search files"}
                    className="pl-10 pr-10"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("")
                        setPage(1)
                      }}
                      aria-label={labels.clearSearch || "Clear search"}
                      className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {mode === "destination" ? (
                    <Select
                      value={kind}
                      onValueChange={(value) => {
                        setKind(value as FileKindFilter)
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="min-w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectItem value="all"><File className="size-4" />{labels.allTypes || "All types"}</SelectItem>
                        <SelectItem value="image"><ImageIcon className="size-4" />{labels.images || "Images"}</SelectItem>
                        <SelectItem value="video"><Video className="size-4" />{labels.videos || "Videos"}</SelectItem>
                        <SelectItem value="document"><FileText className="size-4" />{labels.documents || "Documents"}</SelectItem>
                        <SelectItem value="other"><File className="size-4" />{labels.other || "Other"}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}

                  <Select
                    value={sort}
                    onValueChange={(value) => {
                      setSort(value as FileSort)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="min-w-36">
                      <ArrowDownUp className="size-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="newest">{labels.newest || "Newest"}</SelectItem>
                      <SelectItem value="oldest">{labels.oldest || "Oldest"}</SelectItem>
                      <SelectItem value="name">{labels.nameSort || "Name A–Z"}</SelectItem>
                      <SelectItem value="size">{labels.sizeSort || "Largest"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
                {isLoading ? (
                  <div className="flex h-full min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {labels.loading}
                  </div>
                ) : filteredFiles.length === 0 ? (
                  emptyContent
                ) : (
                  paginatedFiles.map((file) => {
                    const isSelected = activeFileId === file.id

                    return (
                      <button
                        key={file.id}
                        type="button"
                        onClick={() => handleSelectFile(file)}
                        aria-pressed={isSelected}
                        data-selected={isSelected}
                        className="group flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:bg-accent data-[selected=true]:bg-primary/[0.06] sm:gap-4 sm:px-6"
                      >
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background text-transparent group-hover:border-primary/40"
                          }`}
                        >
                          <Check className="size-3" aria-hidden />
                        </span>
                        <FileThumbnail file={file} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">{file.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">/{file.alias}</span>
                        </span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground sm:text-sm">{file.sizeLabel}</span>
                      </button>
                    )
                  })
                )}
              </div>

              {filteredFiles.length > 0 ? (
                <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {labels.rangeLabel
                      ? labels.rangeLabel(firstVisibleFile, lastVisibleFile, filteredFiles.length)
                      : `${firstVisibleFile}–${lastVisibleFile} / ${filteredFiles.length}`}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
                      <span className="sr-only">{labels.previous || "Previous page"}</span>
                      <span aria-hidden>‹</span>
                    </Button>
                    {visiblePages.map((pageNumber, index) => (
                      <div key={pageNumber} className="flex items-center gap-1">
                        {index > 0 && pageNumber - visiblePages[index - 1] > 1 ? <span className="px-1 text-muted-foreground">…</span> : null}
                        <Button
                          type="button"
                          variant={pageNumber === currentPage ? "default" : "ghost"}
                          size="icon-sm"
                          onClick={() => setPage(pageNumber)}
                          aria-current={pageNumber === currentPage ? "page" : undefined}
                        >
                          {pageNumber}
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="ghost" size="icon-sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>
                      <span className="sr-only">{labels.next || "Next page"}</span>
                      <span aria-hidden>›</span>
                    </Button>
                  </div>
                </div>
              ) : null}
            </section>
            ) : null}

            {activeTab === "uploads" ? (
            <section
              id={`${inputId}-uploads-panel`}
              role="tabpanel"
              aria-labelledby={`${inputId}-uploads-tab`}
              className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6"
            >
              {upload ? (
                <label
                  htmlFor={inputId}
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-8 text-center transition-colors focus-within:ring-2 focus-within:ring-primary/40 ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/15 hover:border-primary/35 hover:bg-muted/25"
                  } ${upload.isUploading ? "pointer-events-none opacity-70" : ""}`}
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-border bg-background text-muted-foreground">
                    {upload.isUploading ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {upload.isUploading ? upload.uploadingLabel : labels.dragHint || "Drop files here or browse"}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {labels.browseHint || upload.label}
                    </span>
                  </span>
                  {upload.isUploading && uploadProgress !== null ? (
                    <div className="w-full max-w-xs space-y-2" aria-live="polite">
                      <span className="block text-right text-xs font-medium tabular-nums text-foreground">
                        {uploadProgress}%
                      </span>
                      <Progress
                        value={uploadProgress}
                        aria-label={`${upload.uploadingLabel} ${uploadProgress}%`}
                        aria-valuetext={`${uploadProgress}%`}
                      />
                    </div>
                  ) : (
                    <span className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground">
                      {upload.label}
                    </span>
                  )}
                  <input
                    id={inputId}
                    type="file"
                    accept={upload.accept}
                    multiple={upload.multiple}
                    className="sr-only"
                    disabled={upload.isUploading}
                    onChange={upload.onChange}
                  />
                </label>
              ) : null}
            </section>
            ) : null}
          </div>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter className="shrink-0 flex-col-reverse gap-3 border-border bg-card sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 text-sm text-muted-foreground">
            {footer}
            {!footer && pendingFile && labels.selectedLabel ? (
              <p className="truncate">
                {labels.selectedLabel} <span className="font-medium text-foreground">{pendingFile.name}</span>
              </p>
            ) : null}
          </div>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <ResponsiveDialogClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingFileId(null)}
                className="h-9 rounded-lg shadow-none"
              >
                {labels.close}
              </Button>
            </ResponsiveDialogClose>
            <Button
              type="button"
              onClick={handleConfirmSelection}
              disabled={!pendingFile || isLoading}
              className="h-9 rounded-lg shadow-none"
            >
              {labels.select}
              {pendingFile ? <Check className="size-3.5" aria-hidden /> : null}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
