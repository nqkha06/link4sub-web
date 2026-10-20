"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Folder,
  FolderInput,
  FolderPlus,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  bulkDeleteAdminMedia,
  bulkMoveAdminMedia,
  createAdminMediaFolder,
  deleteAdminMedia,
  deleteAdminMediaFolder,
  getAdminMedia,
  getAdminMediaFolders,
  moveAdminMedia,
  updateAdminMedia,
  updateAdminMediaFolder,
  uploadAdminMedia,
} from "@/features/admin-media/api/admin-media.client";
import type {
  AdminMedia,
  AdminMediaFolder,
  AdminMediaQuery,
} from "@/features/admin-media/types";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";

type Permissions = {
  upload: boolean;
  update: boolean;
  delete: boolean;
  manageFolders: boolean;
};

export function AdminMediaLibrary({
  permissions,
}: {
  permissions: Permissions;
}) {
  const t = useTranslations("Admin.media");
  const tc = useTranslations("Admin.common");
  const uploadRef = React.useRef<HTMLInputElement>(null);
  const [folders, setFolders] = React.useState<AdminMediaFolder[]>([]);
  const [items, setItems] = React.useState<AdminMedia[]>([]);
  const [folderId, setFolderId] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState("");
  const [type, setType] = React.useState("");
  const [sortBy, setSortBy] =
    React.useState<AdminMediaQuery["sortBy"]>("createdAt");
  const [sortOrder, setSortOrder] =
    React.useState<AdminMediaQuery["sortOrder"]>("desc");
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [folderDialog, setFolderDialog] = React.useState<
    { mode: "create"; parentId: number | null } | { mode: "rename"; folder: AdminMediaFolder } | null
  >(null);
  const [deleteFolder, setDeleteFolder] =
    React.useState<AdminMediaFolder | null>(null);
  const [moveIds, setMoveIds] = React.useState<number[] | null>(null);
  const [deleteIds, setDeleteIds] = React.useState<number[] | null>(null);
  const [editing, setEditing] = React.useState<AdminMedia | null>(null);
  const [preview, setPreview] = React.useState<AdminMedia | null>(null);

  const loadFolders = React.useCallback(async () => {
    setFolders(await getAdminMediaFolders());
  }, []);

  const loadItems = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAdminMedia({
        page,
        limit: 24,
        search: search.trim() || undefined,
        type: type || undefined,
        folderId,
        sortBy,
        sortOrder,
      });
      setItems(response.data);
      setTotal(response.meta.total);
      setPageCount(response.meta.totalPages);
      setSelected(new Set());
    } catch (loadError) {
      setError(messageOf(loadError, t("library.loadFailed")));
    } finally {
      setLoading(false);
    }
  }, [folderId, page, search, sortBy, sortOrder, type, t]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timeout);
  }, [loadItems]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadFolders().catch((loadError) =>
        setError(messageOf(loadError, t("library.foldersLoadFailed"))),
      );
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadFolders, t]);

  const currentFolder = folders.find((folder) => folder.id === folderId);
  const breadcrumb = buildBreadcrumb(folders, folderId);

  async function refresh() {
    await Promise.all([loadItems(), loadFolders()]);
  }

  async function handleUpload(files: File[]) {
    setUploading(true);
    setError("");
    try {
      const uploaded = await uploadAdminMedia(files, folderId);
      toast.success(t("library.uploaded", { count: uploaded.length }));
      await refresh();
    } catch (uploadError) {
      setError(messageOf(uploadError, t("library.uploadFailed")));
    } finally {
      setUploading(false);
    }
  }

  function toggle(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid min-h-[620px] lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden border-r bg-muted/10 p-3 lg:block">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {t("library.folders")}
              </p>
              {permissions.manageFolders ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setFolderDialog({ mode: "create", parentId: folderId })
                  }
                >
                  <FolderPlus />
                  <span className="sr-only">{t("folderDialog.createTitle")}</span>
                </Button>
              ) : null}
            </div>
            <FolderNavButton
              active={folderId === null}
              name={t("library.rootFolder")}
              count={folderId === null ? total : undefined}
              onClick={() => {
                setFolderId(null);
                setPage(1);
              }}
            />
            <div className="mt-1 space-y-1">
              {folders
                .filter((folder) => folder.parentId === null)
                .map((folder) => (
                  <FolderNavTree
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    activeId={folderId}
                    onSelect={(id) => {
                      setFolderId(id);
                      setPage(1);
                    }}
                  />
                ))}
            </div>
          </aside>

          <section className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-3 border-b p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-52 flex-1">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("library.searchPlaceholder")}
                    className="pl-8"
                  />
                </div>
                <select
                  value={folderId ?? "root"}
                  onChange={(event) => {
                    setFolderId(
                      event.target.value === "root"
                        ? null
                        : Number(event.target.value),
                    );
                    setPage(1);
                  }}
                  className="h-9 max-w-48 rounded-md border bg-background px-3 text-sm lg:hidden"
                >
                  <option value="root">{t("library.rootFolder")}</option>
                  {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <select
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">{t("library.allTypes")}</option>
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG/JPEG</option>
                  <option value="image/webp">WEBP</option>
                  <option value="image/x-icon">ICO</option>
                </select>
                <select
                  value={`${sortBy}:${sortOrder}`}
                  onChange={(event) => {
                    const [field, order] = event.target.value.split(":") as [
                      AdminMediaQuery["sortBy"],
                      AdminMediaQuery["sortOrder"],
                    ];
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                  }}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="createdAt:desc">{t("library.sort.newest")}</option>
                  <option value="createdAt:asc">{t("library.sort.oldest")}</option>
                  <option value="fileName:asc">{t("library.sort.nameAsc")}</option>
                  <option value="size:desc">{t("library.sort.sizeDesc")}</option>
                </select>
                {permissions.upload ? (
                  <>
                    <input
                      ref={uploadRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,.ico"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        if (event.target.files?.length) {
                          void handleUpload(Array.from(event.target.files));
                        }
                        event.target.value = "";
                      }}
                    />
                    <Button
                      type="button"
                      disabled={uploading}
                      onClick={() => uploadRef.current?.click()}
                    >
                      {uploading ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Upload />
                      )}
                      {t("library.upload")}
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="flex min-h-8 flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                  <button
                    type="button"
                    className="hover:text-foreground"
                    onClick={() => setFolderId(null)}
                  >
                    {t("library.breadcrumbRoot")}
                  </button>
                  {breadcrumb.map((folder) => (
                    <React.Fragment key={folder.id}>
                      <span>/</span>
                      <button
                        type="button"
                        className="truncate font-medium text-foreground"
                        onClick={() => setFolderId(folder.id)}
                      >
                        {folder.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {currentFolder && permissions.manageFolders ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setFolderDialog({
                            mode: "rename",
                            folder: currentFolder,
                          })
                        }
                      >
                        <Pencil /> {t("library.rename")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteFolder(currentFolder)}
                      >
                        <Trash2 /> {t("library.deleteFolder")}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {selected.size ? (
              <div className="flex flex-wrap items-center gap-2 border-b bg-primary/5 px-4 py-2">
                <span className="mr-auto text-sm font-medium">
                  {t("library.selectedFiles", { count: selected.size })}
                </span>
                {permissions.update ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setMoveIds([...selected])}
                  >
                    <FolderInput /> {t("library.move")}
                  </Button>
                ) : null}
                {permissions.delete ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteIds([...selected])}
                  >
                    <Trash2 /> {tc("delete")}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  <X />
                  <span className="sr-only">{t("library.clearSelection")}</span>
                </Button>
              </div>
            ) : null}

            {error ? (
              <div className="border-b bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex-1 p-4">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                  {Array.from({ length: 18 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-[4/5] rounded-xl" />
                  ))}
                </div>
              ) : items.length ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                  {items.map((file) => (
                    <MediaCard
                      key={file.id}
                      file={file}
                      selected={selected.has(file.id)}
                      permissions={permissions}
                      onToggle={() => toggle(file.id)}
                      onPreview={() => setPreview(file)}
                      onEdit={() => setEditing(file)}
                      onMove={() => setMoveIds([file.id])}
                      onDelete={() => setDeleteIds([file.id])}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className="grid min-h-80 place-items-center rounded-xl border border-dashed bg-muted/5"
                  onDragOver={(event) => {
                    if (permissions.upload) event.preventDefault();
                  }}
                  onDrop={(event) => {
                    if (!permissions.upload) return;
                    event.preventDefault();
                    void handleUpload(Array.from(event.dataTransfer.files));
                  }}
                >
                  <div className="max-w-sm px-6 text-center">
                    <ImageIcon className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">
                      {t("library.emptyTitle")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("library.emptyDescription")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t("library.footer", { total, page, pageCount })}
              </p>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={page >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <FolderFormDialog
        state={folderDialog}
        onOpenChange={(open) => {
          if (!open) setFolderDialog(null);
        }}
        onSaved={async () => {
          setFolderDialog(null);
          await loadFolders();
        }}
      />
      <DeleteFolderDialog
        folder={deleteFolder}
        onOpenChange={(open) => {
          if (!open) setDeleteFolder(null);
        }}
        onDeleted={async () => {
          setDeleteFolder(null);
          setFolderId(null);
          await refresh();
        }}
      />
      <MoveDialog
        ids={moveIds}
        folders={folders}
        onOpenChange={(open) => {
          if (!open) setMoveIds(null);
        }}
        onMoved={async () => {
          setMoveIds(null);
          await refresh();
        }}
      />
      <DeleteMediaDialog
        ids={deleteIds}
        onOpenChange={(open) => {
          if (!open) setDeleteIds(null);
        }}
        onDeleted={async () => {
          setDeleteIds(null);
          await refresh();
        }}
      />
      <MediaMetadataDialog
        file={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSaved={async () => {
          setEditing(null);
          await loadItems();
        }}
      />
      <PreviewDialog
        file={preview}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
      />
    </>
  );
}

function MediaCard({
  file,
  selected,
  permissions,
  onToggle,
  onPreview,
  onEdit,
  onMove,
  onDelete,
}: {
  file: AdminMedia;
  selected: boolean;
  permissions: Permissions;
  onToggle: () => void;
  onPreview: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Admin.media");
  const tc = useTranslations("Admin.common");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition",
        selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/35",
      )}
    >
      <button
        type="button"
        className="block aspect-square w-full overflow-hidden bg-muted/30"
        onClick={onPreview}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.thumbnailUrl || file.url}
          alt={file.altText || ""}
          className="size-full object-cover transition group-hover:scale-[1.02]"
        />
      </button>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          "absolute left-2 top-2 grid size-6 place-items-center rounded-md border shadow-sm",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "bg-background/90 text-transparent hover:text-muted-foreground",
        )}
      >
        <Check className="size-3.5" />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="absolute right-2 top-2 bg-background/90"
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onPreview}>
            {t("card.preview")}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              void copyToClipboard(
                new URL(file.url, window.location.origin).toString(),
              ).then((copied) =>
                copied
                  ? toast.success(t("card.urlCopied"))
                  : toast.error(tCommon("copyFailed")),
              );
            }}
          >
            <Copy /> {t("card.copyUrl")}
          </DropdownMenuItem>
          {permissions.update ? (
            <>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> {t("card.editMetadata")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onMove}>
                <FolderInput /> {t("library.move")}
              </DropdownMenuItem>
            </>
          ) : null}
          {permissions.delete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 /> {tc("delete")}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="space-y-1 border-t px-3 py-2.5">
        <p className="truncate text-sm font-medium">{file.fileName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {file.extension.toUpperCase()} · {file.sizeLabel}
          {file.width && file.height ? ` · ${file.width}×${file.height}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(
            new Date(file.createdAt),
          )}
        </p>
      </div>
    </article>
  );
}

function FolderNavTree({
  folder,
  folders,
  activeId,
  onSelect,
  depth = 0,
}: {
  folder: AdminMediaFolder;
  folders: AdminMediaFolder[];
  activeId: number | null;
  onSelect: (id: number) => void;
  depth?: number;
}) {
  return (
    <>
      <FolderNavButton
        active={activeId === folder.id}
        name={folder.name}
        count={folder.fileCount}
        onClick={() => onSelect(folder.id)}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
      />
      {folders
        .filter((item) => item.parentId === folder.id)
        .map((child) => (
          <FolderNavTree
            key={child.id}
            folder={child}
            folders={folders}
            activeId={activeId}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </>
  );
}

function FolderNavButton({
  active,
  name,
  count,
  onClick,
  style,
}: {
  active: boolean;
  name: string;
  count?: number;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      style={style}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Folder className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate text-left">{name}</span>
      {count !== undefined ? (
        <span className="text-xs tabular-nums">{count}</span>
      ) : null}
    </button>
  );
}

function FolderFormDialog({
  state,
  onOpenChange,
  onSaved,
}: {
  state:
    | { mode: "create"; parentId: number | null }
    | { mode: "rename"; folder: AdminMediaFolder }
    | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("Admin.media.folderDialog");
  const tc = useTranslations("Admin.common");
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setName(state?.mode === "rename" ? state.folder.name : "");
      setError("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [state]);
  async function submit() {
    if (!state || !name.trim()) return;
    setSaving(true);
    setError("");
    try {
      if (state.mode === "create") {
        await createAdminMediaFolder({ name, parentId: state.parentId });
      } else {
        await updateAdminMediaFolder(state.folder.id, { name });
      }
      toast.success(
        state.mode === "create" ? t("created") : t("renamed"),
      );
      await onSaved();
    } catch (saveError) {
      setError(messageOf(saveError, t("saveFailed")));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={Boolean(state)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {state?.mode === "rename" ? t("renameTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          autoFocus
          maxLength={100}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void submit();
          }}
          placeholder={t("namePlaceholder")}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button disabled={saving || !name.trim()} onClick={() => void submit()}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFolderDialog({
  folder,
  onOpenChange,
  onDeleted,
}: {
  folder: AdminMediaFolder | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => Promise<void>;
}) {
  const t = useTranslations("Admin.media.deleteFolder");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  return (
    <AlertDialog open={Boolean(folder)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("title", { name: folder?.name ?? "" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              if (!folder) return;
              setDeleting(true);
              setError("");
              void deleteAdminMediaFolder(folder.id)
                .then(async () => {
                  toast.success(t("deleted"));
                  await onDeleted();
                })
                .catch((deleteError) =>
                  setError(messageOf(deleteError, t("failed"))),
                )
                .finally(() => setDeleting(false));
            }}
          >
            {deleting ? <Loader2 className="animate-spin" /> : null}
            {tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MoveDialog({
  ids,
  folders,
  onOpenChange,
  onMoved,
}: {
  ids: number[] | null;
  folders: AdminMediaFolder[];
  onOpenChange: (open: boolean) => void;
  onMoved: () => Promise<void>;
}) {
  const t = useTranslations("Admin.media");
  const tc = useTranslations("Admin.common");
  const [folderId, setFolderId] = React.useState<number | "root">("root");
  const [moving, setMoving] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFolderId("root");
      setError("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [ids]);
  async function submit() {
    if (!ids?.length) return;
    setMoving(true);
    setError("");
    try {
      if (ids.length === 1) {
        await moveAdminMedia(ids[0]!, folderId === "root" ? null : folderId);
      } else {
        await bulkMoveAdminMedia(
          ids,
          folderId === "root" ? null : folderId,
        );
      }
      toast.success(t("move.moved", { count: ids.length }));
      await onMoved();
    } catch (moveError) {
      setError(messageOf(moveError, t("move.failed")));
    } finally {
      setMoving(false);
    }
  }
  return (
    <Dialog open={Boolean(ids)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("move.title")}</DialogTitle>
          <DialogDescription>
            {t("move.description", { count: ids?.length || 0 })}
          </DialogDescription>
        </DialogHeader>
        <select
          value={folderId}
          onChange={(event) =>
            setFolderId(
              event.target.value === "root" ? "root" : Number(event.target.value),
            )
          }
          className="h-10 rounded-md border bg-background px-3 text-sm"
        >
          <option value="root">{t("library.rootFolder")}</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button disabled={moving} onClick={() => void submit()}>
            {moving ? <Loader2 className="animate-spin" /> : <FolderInput />}
            {t("library.move")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMediaDialog({
  ids,
  onOpenChange,
  onDeleted,
}: {
  ids: number[] | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => Promise<void>;
}) {
  const t = useTranslations("Admin.media.deleteMedia");
  const tc = useTranslations("Admin.common");
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const timeout = window.setTimeout(() => setError(""), 0);
    return () => window.clearTimeout(timeout);
  }, [ids]);
  return (
    <AlertDialog open={Boolean(ids)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("title", { count: ids?.length || 0 })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              if (!ids?.length) return;
              setDeleting(true);
              setError("");
              const action =
                ids.length === 1
                  ? deleteAdminMedia(ids[0]!)
                  : bulkDeleteAdminMedia(ids);
              void action
                .then(async () => {
                  toast.success(t("deleted", { count: ids.length }));
                  await onDeleted();
                })
                .catch((deleteError) =>
                  setError(messageOf(deleteError, t("failed"))),
                )
                .finally(() => setDeleting(false));
            }}
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {tc("delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function MediaMetadataDialog({
  file,
  onOpenChange,
  onSaved,
}: {
  file: AdminMedia | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const t = useTranslations("Admin.media.metadata");
  const tc = useTranslations("Admin.common");
  const [fileName, setFileName] = React.useState("");
  const [altText, setAltText] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFileName(file?.fileName || "");
      setAltText(file?.altText || "");
      setCaption(file?.caption || "");
      setError("");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [file]);
  async function submit() {
    if (!file) return;
    setSaving(true);
    setError("");
    try {
      await updateAdminMedia(file.id, { fileName, altText, caption });
      toast.success(t("updated"));
      await onSaved();
    } catch (saveError) {
      setError(messageOf(saveError, t("failed")));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="grid gap-1.5 text-sm">
            {t("fileName")}
            <Input value={fileName} onChange={(event) => setFileName(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            {t("altText")}
            <Input value={altText} onChange={(event) => setAltText(event.target.value)} />
          </label>
          <label className="grid gap-1.5 text-sm">
            {t("caption")}
            <Textarea value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tc("cancel")}
          </Button>
          <Button disabled={saving || !fileName.trim()} onClick={() => void submit()}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewDialog({
  file,
  onOpenChange,
}: {
  file: AdminMedia | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(file)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{file?.fileName}</DialogTitle>
          <DialogDescription>
            {file?.mimeType} · {file?.sizeLabel}
            {file?.width && file.height ? ` · ${file.width}×${file.height}` : ""}
          </DialogDescription>
        </DialogHeader>
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={file.url}
            alt={file.altText || ""}
            className="max-h-[70vh] w-full rounded-lg border bg-muted/20 object-contain"
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function buildBreadcrumb(
  folders: AdminMediaFolder[],
  folderId: number | null,
) {
  const result: AdminMediaFolder[] = [];
  const seen = new Set<number>();
  let cursor = folderId;
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    const folder = folders.find((item) => item.id === cursor);
    if (!folder) break;
    result.unshift(folder);
    cursor = folder.parentId;
  }
  return result;
}

function messageOf(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
