"use client";

import { Folder } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { TablePagination } from "@/components/table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { FileFolderDto, ManagedFileDto } from "@/lib/api-client";
import { cn } from "@/lib/utils";

import { startItemsDrag, useDropTarget, type DraggedItems } from "./file-dnd";
import { FileRowActions } from "./file-row-actions";
import { FileTypeIcon, formatFileDate, getFileType } from "./file-utils";
import { FolderRowActions, type FolderActionHandlers } from "./folder-row-actions";
import type { ManagedFileView } from "./types";

type FilesTableProps = FolderActionHandlers & {
  files: ManagedFileView[];
  /** Thư mục con hiển thị phía trên danh sách file (chỉ trang đầu, khi không tìm kiếm). */
  folders: FileFolderDto[];
  /** Hiện thư mục chứa file (khi tìm kiếm trên mọi thư mục). */
  showLocation: boolean;
  selectedIds: Set<string>;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSelect: (id: string, selected: boolean) => void;
  onSelectPage: (selected: boolean) => void;
  onPreview: (file: ManagedFileDto) => void;
  onDownload: (file: ManagedFileDto) => void;
  onRename: (file: ManagedFileDto) => void;
  onMove: (file: ManagedFileDto) => void;
  onDelete: (file: ManagedFileDto) => void;
  onDropItems: (items: DraggedItems, targetFolderId: string | null) => void;
};

function FolderIcon() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
      <Folder className="size-5 fill-current/20" aria-hidden />
    </span>
  );
}

/** Kéo một file: nếu file đang được chọn thì kéo cả nhóm đã chọn. */
function dragFiles(file: ManagedFileDto, selectedIds: Set<string>): DraggedItems {
  return { fileIds: selectedIds.has(file.id) ? [...selectedIds] : [file.id], folderIds: [] };
}

function FolderTableRow({ folder, props }: { folder: FileFolderDto; props: FilesTableProps }) {
  const t = useTranslations("Files.folders");
  const locale = useLocale();
  const drop = useDropTarget(folder.id, props.onDropItems);
  return (
    <TableRow
      {...drop.props}
      draggable
      onDragStart={(event) => startItemsDrag(event, { fileIds: [], folderIds: [folder.id] })}
      onDoubleClick={() => props.onOpenFolder(folder.id)}
      className={cn("h-16", drop.over && "bg-primary/10 outline-2 -outline-offset-2 outline-primary/50")}
    >
      <TableCell className="px-4" />
      <TableCell className="px-4">
        <div className="flex min-w-0 items-center gap-3">
          <FolderIcon />
          <button
            type="button"
            className="block max-w-72 truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline"
            onClick={() => props.onOpenFolder(folder.id)}
          >
            {folder.name}
          </button>
        </div>
      </TableCell>
      <TableCell className="px-4 text-muted-foreground">{t("type")}</TableCell>
      <TableCell className="px-4 text-muted-foreground tabular-nums">
        {t("itemCount", { count: folder.fileCount + folder.childCount })}
      </TableCell>
      <TableCell className="px-4 text-muted-foreground">{formatFileDate(folder.createdAt, false, locale)}</TableCell>
      <TableCell className="px-4"><FolderRowActions folder={folder} {...props} /></TableCell>
    </TableRow>
  );
}

function FileLocation({ file, onOpenFolder }: { file: ManagedFileDto; onOpenFolder: (id: string | null) => void }) {
  const t = useTranslations("Files.folders");
  return (
    <button
      type="button"
      onClick={() => onOpenFolder(file.folderId)}
      className="mt-0.5 flex max-w-72 items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary hover:underline"
    >
      <Folder className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{file.folderName ?? t("root")}</span>
    </button>
  );
}

export function FilesTable(props: FilesTableProps) {
  const t = useTranslations("Files");
  const tf = useTranslations("Files.folders");
  const locale = useLocale();
  const selectedOnPage = props.files.filter((file) => props.selectedIds.has(file.id)).length;
  const allSelected = props.files.length > 0 && selectedOnPage === props.files.length;
  const indeterminate = selectedOnPage > 0 && !allSelected;

  return (
    <TooltipProvider>
      <section aria-label={t("table.label")} className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden overflow-x-auto md:block">
          <Table className="min-w-[1040px]">
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_var(--border)]">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 px-4">
                  <Checkbox checked={indeterminate ? "indeterminate" : allSelected} disabled={!props.files.length} onCheckedChange={(checked) => props.onSelectPage(Boolean(checked))} aria-label={t("table.selectAll")} />
                </TableHead>
                <TableHead className="w-[52%] px-4">{t("table.file")}</TableHead>
                <TableHead className="px-4">{t("table.type")}</TableHead>
                <TableHead className="px-4">{t("table.size")}</TableHead>
                <TableHead className="px-4">{t("table.uploadedAt")}</TableHead>
                <TableHead className="w-12 px-4">
                  <span className="sr-only">{t("table.actions")}</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {props.folders.map((folder) => <FolderTableRow key={`folder-${folder.id}`} folder={folder} props={props} />)}
              {props.files.map((file) => {
                const selected = props.selectedIds.has(file.id);
                return (
                  <TableRow
                    key={file.id}
                    draggable
                    onDragStart={(event) => startItemsDrag(event, dragFiles(file, props.selectedIds))}
                    data-state={selected ? "selected" : undefined}
                    className="h-16 data-[state=selected]:bg-primary/5"
                  >
                    <TableCell className="px-4"><Checkbox checked={selected} onCheckedChange={(checked) => props.onSelect(file.id, Boolean(checked))} aria-label={t("table.select", { name: file.name })} /></TableCell>
                    <TableCell className="px-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileTypeIcon file={file} />
                        <div className="min-w-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" className="block max-w-72 truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline" onClick={() => props.onPreview(file)}>{file.name}</button>
                            </TooltipTrigger>
                            <TooltipContent>{file.name}</TooltipContent>
                          </Tooltip>
                          {props.showLocation ? <FileLocation file={file} onOpenFolder={props.onOpenFolder} /> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 text-muted-foreground">{t(`types.${getFileType(file)}`)}</TableCell>
                    <TableCell className="px-4 font-medium tabular-nums">{file.sizeLabel}</TableCell>
                    <TableCell className="px-4 text-muted-foreground">{formatFileDate(file.createdAt, false, locale)}</TableCell>
                    <TableCell className="px-4"><FileRowActions file={file} onPreview={props.onPreview} onDownload={props.onDownload} onRename={props.onRename} onMove={props.onMove} onDelete={props.onDelete} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="divide-y divide-border md:hidden">
          {props.folders.map((folder) => (
            <article key={`folder-${folder.id}`} className="flex min-h-[76px] items-center gap-3 px-4 py-3">
              <span className="size-4 shrink-0" aria-hidden />
              <FolderIcon />
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => props.onOpenFolder(folder.id)}>
                <span className="block truncate text-sm font-medium text-foreground">{folder.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{tf("itemCount", { count: folder.fileCount + folder.childCount })}</span>
              </button>
              <FolderRowActions folder={folder} {...props} />
            </article>
          ))}
          {props.files.map((file) => {
            const selected = props.selectedIds.has(file.id);
            return <article key={file.id} className={`flex min-h-[76px] items-center gap-3 px-4 py-3 ${selected ? "bg-primary/5" : ""}`}>
              <Checkbox checked={selected} onCheckedChange={(checked) => props.onSelect(file.id, Boolean(checked))} aria-label={t("table.select", { name: file.name })} />
              <FileTypeIcon file={file} />
              <div className="min-w-0 flex-1"><button type="button" className="block max-w-full truncate text-left text-sm font-medium text-foreground" onClick={() => props.onPreview(file)}>{file.name}</button>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs tabular-nums text-muted-foreground">{file.sizeLabel}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{formatFileDate(file.createdAt, false, locale)}</span>
                </div>
                {props.showLocation ? <FileLocation file={file} onOpenFolder={props.onOpenFolder} /> : null}
              </div>
              <FileRowActions file={file} onPreview={props.onPreview} onDownload={props.onDownload} onRename={props.onRename} onMove={props.onMove} onDelete={props.onDelete} />
            </article>;
          })}
        </div>

        {props.total > 0 ? (
          <footer className="border-t border-border px-4 py-3">
            <TablePagination
              page={props.page}
              pageSize={props.pageSize}
              totalItems={props.total}
              onPageChange={props.onPageChange}
              onPageSizeChange={props.onPageSizeChange}
            />
          </footer>
        ) : null}
      </section>
    </TooltipProvider>
  );
}
