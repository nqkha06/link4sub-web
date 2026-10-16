"use client";

import { useState } from "react";
import { Info, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { DestinationDeleteDialog } from "@/components/dashboard/destination-delete-dialog";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FilePreviewSheet } from "@/components/dashboard/files/file-preview-sheet";
import { FileRenameCredenza } from "@/components/dashboard/files/file-rename-credenza";
import { FileUploadDialog } from "@/components/dashboard/files/file-upload-dialog";
import { FilesBreadcrumb } from "@/components/dashboard/files/files-breadcrumb";
import { FilesBulkActions } from "@/components/dashboard/files/files-bulk-actions";
import { FilesEmptyState, FilesErrorState, FilesNoResults, FilesSkeleton, FolderEmptyState, FolderLoadingOverlay } from "@/components/dashboard/files/files-states";
import { FilesTable } from "@/components/dashboard/files/files-table";
import { FilesToolbar } from "@/components/dashboard/files/files-toolbar";
import { FilesUploadTray } from "@/components/dashboard/files/files-upload-tray";
import { FolderNameCredenza } from "@/components/dashboard/files/folder-name-credenza";
import { childFolders, folderPath } from "@/components/dashboard/files/folder-tree";
import { MoveItemsCredenza } from "@/components/dashboard/files/move-items-credenza";
import { StorageUsage } from "@/components/dashboard/files/storage-usage";
import { useFilesController } from "@/components/dashboard/files/use-files-controller";
import { PageContainer, PageHeader } from "@/components/dashboard/ui";

export function FilesView() {
  const t = useTranslations("Files");
  const controller = useFilesController();
  const [infoVisible, setInfoVisible] = useState(true);
  const hasCriteria = Boolean(controller.query) || controller.filters.type !== "all" || controller.sort !== "newest";
  // Trong lúc mở thư mục mới, vẫn hiện nội dung thư mục cũ (làm mờ) cho tới khi tải xong.
  const listFolderId = controller.openingFolder ? controller.loadedFolderId ?? null : controller.currentFolderId;
  const subfolders = controller.searching || controller.page > 1 ? [] : childFolders(controller.folders, listFolderId);
  const path = folderPath(controller.folders, controller.currentFolderId);
  const initialLoading = controller.loading && controller.files.length === 0 && !controller.error;
  const folderEmpty = !controller.searching && controller.files.length === 0 && subfolders.length === 0;
  const libraryEmpty = folderEmpty && listFolderId === null && controller.folders.length === 0 && !hasCriteria;

  // Thư mục đang chứa các mục cần di chuyển (undefined khi lẫn nhiều thư mục).
  const moveSource = (() => {
    const request = controller.moveRequest;
    if (!request) return undefined;
    if (!controller.searching) return controller.currentFolderId;
    const sources = new Set(request.fileIds.map((id) => controller.files.find((file) => file.id === id)?.folderId ?? null));
    return sources.size === 1 && !request.folderIds.length ? [...sources][0] : undefined;
  })();
  const pendingFolder = controller.folderPendingDelete;
  const pendingParentName = pendingFolder?.parentId
    ? controller.folders.find((folder) => folder.id === pendingFolder.parentId)?.name ?? t("folders.root")
    : t("folders.root");

  return (
    <PageContainer>
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={
          <Button className="h-10 w-full shrink-0 sm:w-auto" onClick={() => controller.setUploadOpen(true)}>
            <Upload aria-hidden="true" />{t("upload")}
          </Button>
        }
      />
      {initialLoading ? <FilesSkeleton /> : <>
        {infoVisible ? <Alert className="grid-cols-[1rem_1fr_auto] items-center bg-muted/20">
          <Info />
          <AlertTitle className="col-start-2 line-clamp-none leading-5">{t("info.title")}</AlertTitle>
          <AlertDescription className="col-start-2">{t("info.description")}</AlertDescription>
          <Button variant="ghost" size="icon-sm" className="col-start-3 row-start-1 row-span-2" onClick={() => setInfoVisible(false)} aria-label={t("info.dismiss")}><X /></Button>
        </Alert> : null}

        <StorageUsage used={controller.totalSize} reserved={controller.reservedSize} limit={controller.storageLimit} boosted={controller.storageBoosted} />
        <div className="relative">
          <FilesToolbar query={controller.query} filters={controller.filters} sort={controller.sort} loading={controller.loading} onQueryChange={controller.setQuery} onTypeChange={controller.setType} onSortChange={controller.setSort} onClear={controller.clearCriteria} />
          <FilesBulkActions
            count={controller.selectedFiles.length}
            busy={controller.busy}
            onMove={() => controller.setMoveRequest({ fileIds: controller.selectedFiles.map((file) => file.id), folderIds: [] })}
            onDelete={() => controller.setBulkDeleteOpen(true)}
            onClear={controller.clearSelection}
          />
        </div>

        <FilesBreadcrumb
          path={path}
          searching={controller.searching}
          disabled={controller.busy}
          onOpen={controller.openFolder}
          onCreateFolder={() => controller.setFolderDialog({ mode: "create" })}
          onDrop={(items, target) => void controller.moveItems(items, target)}
        />

        <div className="relative">
        {controller.openingFolder ? <FolderLoadingOverlay name={controller.currentFolder?.name} /> : null}
        <div
          aria-busy={controller.openingFolder}
          className={controller.openingFolder ? "pointer-events-none opacity-50 transition-opacity" : "transition-opacity"}
        >
        {controller.error ? <FilesErrorState message={controller.error} onRetry={controller.refresh} />
          : controller.loading && controller.files.length === 0 && subfolders.length === 0 ? <FilesSkeleton />
          : libraryEmpty ? <FilesEmptyState />
          : folderEmpty && !hasCriteria ? <FolderEmptyState onUpload={() => controller.setUploadOpen(true)} onCreateFolder={() => controller.setFolderDialog({ mode: "create" })} />
          : controller.visibleFiles.length === 0 && subfolders.length === 0 ? <FilesNoResults onClear={controller.clearCriteria} />
          : <FilesTable
              files={controller.visibleFiles}
              folders={subfolders}
              showLocation={controller.searching}
              selectedIds={controller.selectedIds}
              page={controller.page}
              pageSize={controller.pageSize}
              total={controller.filteredTotal}
              onPageChange={controller.setPage}
              onPageSizeChange={controller.setPageSize}
              onSelect={controller.selectFile}
              onSelectPage={controller.selectPage}
              onPreview={controller.openPreview}
              onDownload={(file) => void controller.downloadFile(file)}
              onRename={controller.openRename}
              onMove={(file) => controller.setMoveRequest({ fileIds: [file.id], folderIds: [] })}
              onDelete={controller.setFilePendingDelete}
              onOpenFolder={controller.openFolder}
              onRenameFolder={(folder) => controller.setFolderDialog({ mode: "rename", folder })}
              onMoveFolder={(folder) => controller.setMoveRequest({ fileIds: [], folderIds: [folder.id] })}
              onDeleteFolder={controller.setFolderPendingDelete}
              onDropItems={(items, target) => void controller.moveItems(items, target)}
            />}
        </div>
        </div>
      </>}

      <FileUploadDialog open={controller.uploadOpen} queue={controller.uploadQueue} fileSizeLimit={controller.fileSizeLimit} onOpenChange={controller.setUploadOpen} onFilesSelected={controller.addFiles} onRetry={controller.retryUpload} onCancel={controller.cancelUpload} onRemove={controller.removeUpload} />
      <FilesUploadTray queue={controller.uploadQueue} hidden={controller.uploadOpen} onRetry={controller.retryUpload} onCancel={controller.cancelUpload} onRemove={controller.removeUpload} />
      <FilePreviewSheet file={controller.previewFile} open={controller.previewOpen} onOpenChange={controller.setPreviewOpen} onDownload={(file) => void controller.downloadFile(file)} />
      <FileRenameCredenza file={controller.filePendingRename} open={Boolean(controller.filePendingRename)} saving={controller.busy} onOpenChange={(open) => !open && controller.setFilePendingRename(null)} onRename={controller.renameFile} />

      <FolderNameCredenza
        mode={controller.folderDialog?.mode ?? null}
        initialName={controller.folderDialog?.mode === "rename" ? controller.folderDialog.folder.name : ""}
        saving={controller.busy}
        onOpenChange={(open) => !open && controller.setFolderDialog(null)}
        onSave={controller.saveFolder}
      />
      <MoveItemsCredenza
        request={controller.moveRequest}
        folders={controller.folders}
        sourceFolderId={moveSource}
        saving={controller.busy}
        onOpenChange={(open) => !open && controller.setMoveRequest(null)}
        onConfirm={(target) => void controller.confirmMove(target)}
      />

      <AlertDialog open={Boolean(pendingFolder)} onOpenChange={(open) => !open && controller.setFolderPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("folders.deleteDialog.title", { name: pendingFolder?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingFolder && pendingFolder.fileCount + pendingFolder.childCount > 0
                ? t("folders.deleteDialog.descriptionWithItems", {
                    files: pendingFolder.fileCount,
                    folders: pendingFolder.childCount,
                    parent: pendingParentName,
                  })
                : t("folders.deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("folders.deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void controller.confirmDeleteFolder()}>
              {t("folders.deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DestinationDeleteDialog
        open={Boolean(controller.filePendingDelete)}
        onOpenChange={(open) => !open && controller.setFilePendingDelete(null)}
        kind="file"
        ids={controller.filePendingDelete ? [controller.filePendingDelete.id] : []}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", { name: controller.filePendingDelete?.name ?? "" })}
        confirmLabel={t("deleteDialog.confirm")}
        onConfirm={() => void controller.confirmDelete()}
      />

      <DestinationDeleteDialog
        open={controller.bulkDeleteOpen}
        onOpenChange={controller.setBulkDeleteOpen}
        kind="files"
        ids={controller.selectedFiles.map((file) => file.id)}
        title={t("bulkDeleteDialog.title", { count: controller.selectedFiles.length })}
        description={t("bulkDeleteDialog.description")}
        confirmLabel={t("bulkDeleteDialog.confirm")}
        onConfirm={() => void controller.confirmBulkDelete()}
      />
    </PageContainer>
  );
}
