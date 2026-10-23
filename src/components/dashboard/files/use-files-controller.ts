"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  bulkDeleteFiles,
  createFileFolder,
  deleteFile,
  deleteFileFolder,
  downloadMemberFile,
  getFileFolders,
  getFiles,
  moveFileItems,
  renameFileFolder,
  type FileFolderDto,
  type ManagedFileDto,
  updateFile,
  uploadFile,
} from "@/lib/api-client";
import { generateUuid } from "@/lib/id";
import { uploadErrorMessage } from "@/lib/upload-request";
import { useBusinessConfig } from "@/features/business-settings/use-business-config";

import { FILE_CREATED_EVENT } from "./events";
import type { FileSortOption, FilesFilters, FileTypeFilter, ManagedFileView, UploadQueueItem } from "./types";

const defaultFilters: FilesFilters = { type: "all", status: "all" };
const INDETERMINATE_FILE_SIZE = 2 * 1024 * 1024;
const MAX_CONCURRENT_UPLOADS = 2;
const PROGRESS_UPDATE_INTERVAL_MS = 100;
const SUCCESS_VISIBLE_MS = 700;
const CANCELLED_VISIBLE_MS = 700;

function validType(value: string | null): FileTypeFilter {
  return ["image", "video", "audio", "document", "archive", "other"].includes(value ?? "") ? value as FileTypeFilter : "all";
}
function validSort(value: string | null): FileSortOption {
  return ["newest", "oldest", "name-asc", "name-desc", "size-desc", "size-asc"].includes(value ?? "") ? value as FileSortOption : "newest";
}
function apiSort(sort: FileSortOption) {
  if (sort === "oldest") return { sort: "date" as const, direction: "asc" as const };
  if (sort === "name-asc") return { sort: "name" as const, direction: "asc" as const };
  if (sort === "name-desc") return { sort: "name" as const, direction: "desc" as const };
  if (sort === "size-asc") return { sort: "size" as const, direction: "asc" as const };
  if (sort === "size-desc") return { sort: "size" as const, direction: "desc" as const };
  return { sort: "date" as const, direction: "desc" as const };
}
function withViewData(file: ManagedFileDto): ManagedFileView { return { ...file, usageCount: file.usageCount }; }

export function useFilesController() {
  const t = useTranslations("Files.toasts");
  const uploadT = useTranslations("Uploads");
  const folderToast = useTranslations("Files.folders.toasts");
  const fileSizeLimit = useBusinessConfig().uploads.memberFileMaxBytes;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [files, setFiles] = useState<ManagedFileView[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [storageLimit, setStorageLimit] = useState(0);
  const [storageBoosted, setStorageBoosted] = useState(false);
  const [reservedSize, setReservedSize] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [query, setQueryState] = useState(() => searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filters, setFilters] = useState<FilesFilters>(() => ({ type: validType(searchParams.get("type")), status: "all" }));
  const [sort, setSortState] = useState<FileSortOption>(() => validSort(searchParams.get("sort")));
  const [page, setPageState] = useState(() => Math.max(Number(searchParams.get("page")) || 1, 1));
  const [pageSize, setPageSizeState] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [previewFile, setPreviewFile] = useState<ManagedFileDto | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filePendingRename, setFilePendingRename] = useState<ManagedFileDto | null>(null);
  const [filePendingDelete, setFilePendingDelete] = useState<ManagedFileDto | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [folders, setFolders] = useState<FileFolderDto[]>([]);
  // Thư mục đang mở lấy thẳng từ URL: mở thư mục là pushState, nên nút Back/Forward
  // của trình duyệt cũng chuyển thư mục mà không tải lại trang.
  const currentFolderId = searchParams.get("folder");
  const [folderDialog, setFolderDialog] = useState<{ mode: "create" } | { mode: "rename"; folder: FileFolderDto } | null>(null);
  const [folderPendingDelete, setFolderPendingDelete] = useState<FileFolderDto | null>(null);
  const [moveRequest, setMoveRequest] = useState<{ fileIds: string[]; folderIds: string[] } | null>(null);
  // Thư mục của lần tải danh sách gần nhất; khác thư mục đang mở = đang mở thư mục mới.
  const [loadedFolderId, setLoadedFolderId] = useState<string | null | undefined>(undefined);
  const uploadControllers = useRef(new Map<string, AbortController>());
  const pendingUploads = useRef<UploadQueueItem[]>([]);
  const activeUploadCount = useRef(0);
  const loadRequestRef = useRef(0);
  const uploadRemovalTimers = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  // Chỉ đổi URL phía trình duyệt (history API, Next.js đồng bộ useSearchParams).
  // router.replace sẽ gọi server render lại trang và làm giật/cuộn trang.
  const syncUrl = useCallback((next: { query: string; filters: FilesFilters; sort: FileSortOption; page: number; folder?: string | null }, mode: "push" | "replace" = "replace") => {
    const params = new URLSearchParams();
    if (next.folder) params.set("folder", next.folder);
    if (next.query) params.set("search", next.query);
    if (next.filters.type !== "all") params.set("type", next.filters.type);
    if (next.sort !== "newest") params.set("sort", next.sort);
    if (next.page > 1) params.set("page", String(next.page));
    const url = `${pathname}${params.size ? `?${params}` : ""}`;
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }, [pathname]);

  // Khi tìm kiếm hoặc lọc, kết quả gồm file ở mọi thư mục.
  const searching = Boolean(debouncedQuery) || filters.type !== "all";

  const loadFolders = useCallback(async () => {
    try {
      setFolders(await getFileFolders());
    } catch {
      // Danh sách file vẫn dùng được khi không tải được thư mục.
    }
  }, []);

  const loadFiles = useCallback(async () => {
    // Chỉ lần tải mới nhất được ghi kết quả (bấm nhanh qua nhiều thư mục).
    const requestId = ++loadRequestRef.current;
    const isLatest = () => requestId === loadRequestRef.current;
    try {
      setLoading(true);
      const response = await getFiles({
        q: debouncedQuery,
        ...(searching ? {} : { folderId: currentFolderId ?? "root" }),
        ...apiSort(sort),
        ...(filters.type !== "all" ? { type: filters.type } : {}),
        page,
        limit: pageSize,
      });
      if (!isLatest()) return;
      setFiles(response.data.map(withViewData));
      setTotalSize(response.meta.summary.usedBytes);
      setStorageLimit(response.meta.summary.limitBytes);
      setStorageBoosted(Boolean(response.meta.summary.tierBoosted));
      setReservedSize(response.meta.summary.reservedBytes);
      setTotalItems(response.meta.total);
      setPageCount(response.meta.totalPages);
      setSelectedIds((current) => new Set([...current].filter((id) => response.data.some((file) => file.id === id))));
      setError("");
    } catch (loadError) {
      if (isLatest()) setError(loadError instanceof Error ? loadError.message : t("loadFailed"));
    } finally {
      if (isLatest()) {
        setLoading(false);
        if (!searching) setLoadedFolderId(currentFolderId);
      }
    }
  }, [currentFolderId, debouncedQuery, filters.type, page, pageSize, searching, sort, t]);

  useEffect(() => { const timer = setTimeout(() => setDebouncedQuery(query), 320); return () => clearTimeout(timer); }, [query]);
  useEffect(() => { void Promise.resolve().then(loadFiles); }, [loadFiles]);
  useEffect(() => { void Promise.resolve().then(loadFolders); }, [loadFolders]);
  useEffect(() => {
    const handleFileCreated = () => void loadFiles();
    window.addEventListener(FILE_CREATED_EVENT, handleFileCreated);
    return () => window.removeEventListener(FILE_CREATED_EVENT, handleFileCreated);
  }, [loadFiles]);
  useEffect(() => {
    const controllers = uploadControllers.current;
    const removalTimers = uploadRemovalTimers.current;

    return () => {
      pendingUploads.current = [];
      controllers.forEach((controller) => controller.abort());
      removalTimers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const setQuery = (value: string) => { setQueryState(value); setPageState(1); syncUrl({ query: value, filters, sort, page: 1, folder: currentFolderId }); };
  const setType = (value: FileTypeFilter) => { const next = { ...filters, type: value }; setFilters(next); setPageState(1); syncUrl({ query, filters: next, sort, page: 1, folder: currentFolderId }); };
  const setSort = (value: FileSortOption) => { setSortState(value); setPageState(1); syncUrl({ query, filters, sort: value, page: 1, folder: currentFolderId }); };
  const setPage = (value: number) => { setPageState(value); syncUrl({ query, filters, sort, page: value, folder: currentFolderId }); };
  const setPageSize = (value: number) => { setPageSizeState(value); setPageState(1); syncUrl({ query, filters, sort, page: 1, folder: currentFolderId }); };
  const clearCriteria = () => { setQueryState(""); setDebouncedQuery(""); setFilters(defaultFilters); setSortState("newest"); setPageState(1); syncUrl({ query: "", filters: defaultFilters, sort: "newest", page: 1, folder: currentFolderId }); };

  const visibleFiles = files;

  function scheduleUploadRemoval(id: string, delay: number) {
    const currentTimer = uploadRemovalTimers.current.get(id);
    if (currentTimer) clearTimeout(currentTimer);

    const timer = setTimeout(() => {
      setUploadQueue((current) => current.filter((entry) => entry.id !== id));
      uploadRemovalTimers.current.delete(id);
    }, delay);

    uploadRemovalTimers.current.set(id, timer);
  }

  async function runUpload(item: UploadQueueItem) {
    const controller = new AbortController();
    let latestProgress = 0;
    let lastProgressUpdateAt = 0;
    let progressTimer: ReturnType<typeof setTimeout> | null = null;

    const flushProgress = () => {
      progressTimer = null;
      lastProgressUpdateAt = Date.now();
      const progress = latestProgress;

      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id && entry.status === "uploading"
            ? { ...entry, progress }
            : entry,
        ),
      );
    };

    const updateProgress = (progress: number) => {
      if (item.indeterminate) return;

      latestProgress = Math.min(95, Math.max(latestProgress, progress));
      const elapsed = Date.now() - lastProgressUpdateAt;

      if (elapsed >= PROGRESS_UPDATE_INTERVAL_MS) {
        if (progressTimer) clearTimeout(progressTimer);
        flushProgress();
        return;
      }

      if (!progressTimer) {
        progressTimer = setTimeout(
          flushProgress,
          PROGRESS_UPDATE_INTERVAL_MS - elapsed,
        );
      }
    };

    uploadControllers.current.set(item.id, controller);
    setUploadQueue((current) =>
      current.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              status: "uploading",
              progress: 0,
              error: undefined,
            }
          : entry,
      ),
    );

    try {
      const uploaded = await uploadFile(item.file, {
        folderId: item.folderId ?? null,
        signal: controller.signal,
        onProgress: updateProgress,
        onFinalizing: () => {
          if (progressTimer) {
            clearTimeout(progressTimer);
            progressTimer = null;
          }

          setUploadQueue((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    status: "finalizing",
                    progress: 95,
                  }
                : entry,
            ),
          );
        },
      });

      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? { ...entry, status: "success", progress: 100 }
            : entry,
        ),
      );
      window.dispatchEvent(new CustomEvent(FILE_CREATED_EVENT, { detail: uploaded }));
      toast.success(t("uploaded", { name: uploaded.name }));
      scheduleUploadRemoval(item.id, SUCCESS_VISIBLE_MS);
    } catch (uploadError) {
      const cancelled = uploadError instanceof DOMException && uploadError.name === "AbortError";
      setUploadQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: cancelled ? "cancelled" : "error",
                error: cancelled
                  ? undefined
                  : uploadErrorMessage(uploadError, uploadT, t("uploadFailed")),
                retryable: !cancelled,
              }
            : entry,
        ),
      );

      if (cancelled) {
        scheduleUploadRemoval(item.id, CANCELLED_VISIBLE_MS);
      }
    } finally {
      if (progressTimer) clearTimeout(progressTimer);
      uploadControllers.current.delete(item.id);
    }
  }

  function drainUploadQueue() {
    while (
      activeUploadCount.current < MAX_CONCURRENT_UPLOADS &&
      pendingUploads.current.length > 0
    ) {
      const item = pendingUploads.current.shift();
      if (!item) return;
      activeUploadCount.current += 1;
      void runUpload(item).finally(() => {
        activeUploadCount.current -= 1;
        drainUploadQueue();
      });
    }
  }

  function enqueueUploads(items: UploadQueueItem[]) {
    pendingUploads.current.push(...items);
    drainUploadQueue();
  }

  const addFiles = (nextFiles: File[]) => {
    const items = nextFiles.map((file, index): UploadQueueItem => ({
      id: `${generateUuid()}-${index}`,
      file,
      status:
        file.size > fileSizeLimit || file.size === 0
          ? "error"
          : "pending",
      progress: 0,
      folderId: currentFolderId,
      indeterminate: file.size < INDETERMINATE_FILE_SIZE,
      retryable: file.size <= fileSizeLimit && file.size > 0,
      error:
        file.size > fileSizeLimit
          ? t("tooLarge", { size: `${Math.round(fileSizeLimit / 1024 / 1024)} MB` })
          : file.size === 0
            ? t("emptyFile")
            : undefined,
    }));
    setUploadQueue((current) => [...current, ...items]);
    enqueueUploads(items.filter((item) => item.status === "pending"));
  };
  const retryUpload = (id: string) => {
    const item = uploadQueue.find((entry) => entry.id === id);
    if (!item || item.status !== "error" || item.retryable === false) return;
    const pending = { ...item, status: "pending" as const, progress: 0, error: undefined };
    setUploadQueue((current) =>
      current.map((entry) => (entry.id === id ? pending : entry)),
    );
    enqueueUploads([pending]);
  };
  const cancelUpload = (id: string) => {
    const pendingIndex = pendingUploads.current.findIndex((item) => item.id === id);
    if (pendingIndex >= 0) {
      pendingUploads.current.splice(pendingIndex, 1);
      setUploadQueue((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: "cancelled" } : item,
        ),
      );
      scheduleUploadRemoval(id, CANCELLED_VISIBLE_MS);
      return;
    }
    uploadControllers.current.get(id)?.abort();
  };
  const removeUpload = (id: string) => {
    const removalTimer = uploadRemovalTimers.current.get(id);
    if (removalTimer) clearTimeout(removalTimer);
    uploadRemovalTimers.current.delete(id);
    setUploadQueue((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const openPreview = (file: ManagedFileDto) => { setPreviewFile(file); setPreviewOpen(true); };
  const openRename = (file: ManagedFileDto) => setFilePendingRename(file);

  function downloadFile(file: ManagedFileDto) {
    downloadMemberFile(file.id, file.name);
  }

  async function renameFile(file: ManagedFileDto, name: string) {
    try { setBusy(true); const updated = await updateFile(file.id, { name }); setFiles((current) => current.map((item) => item.id === file.id ? withViewData(updated) : item)); setPreviewFile((current) => current?.id === file.id ? updated : current); toast.success(t("renamed")); return true; }
    catch (updateError) { toast.error(updateError instanceof Error ? updateError.message : t("renameFailed")); return false; }
    finally { setBusy(false); }
  }
  async function confirmDelete() {
    if (!filePendingDelete) return;
    const target = filePendingDelete;
    setFilePendingDelete(null);
    try { await deleteFile(target.id); setPreviewOpen(false); await loadFiles(); toast.success(t("deleted")); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : t("deleteFailed")); }
  }

  const selectFile = (id: string, selected: boolean) => setSelectedIds((current) => { const next = new Set(current); if (selected) next.add(id); else next.delete(id); return next; });
  const selectPage = (selected: boolean) => setSelectedIds((current) => { const next = new Set(current); visibleFiles.forEach((file) => selected ? next.add(file.id) : next.delete(file.id)); return next; });
  const clearSelection = () => setSelectedIds(new Set());
  const selectedFiles = files.filter((file) => selectedIds.has(file.id));
  async function confirmBulkDelete() {
    setBulkDeleteOpen(false);
    try { setBusy(true); const count = selectedFiles.length; await bulkDeleteFiles(selectedFiles.map((file) => file.id)); clearSelection(); await loadFiles(); toast.success(t("bulkDeleted", { count })); }
    catch (deleteError) { toast.error(deleteError instanceof Error ? deleteError.message : t("bulkDeleteFailed")); }
    finally { setBusy(false); }
  }

  function openFolder(id: string | null) {
    if (id === currentFolderId && !searching) return;
    setQueryState("");
    setDebouncedQuery("");
    setFilters(defaultFilters);
    setPageState(1);
    setSelectedIds(new Set());
    syncUrl({ query: "", filters: defaultFilters, sort, page: 1, folder: id }, "push");
  }

  async function reloadAll() {
    await Promise.all([loadFiles(), loadFolders()]);
  }

  async function saveFolder(name: string) {
    if (!folderDialog) return false;
    try {
      setBusy(true);
      if (folderDialog.mode === "create") {
        await createFileFolder(name, currentFolderId);
        toast.success(folderToast("created", { name }));
      } else {
        await renameFileFolder(folderDialog.folder.id, name);
        toast.success(folderToast("renamed"));
      }
      await loadFolders();
      return true;
    } catch (folderError) {
      toast.error(folderError instanceof Error ? folderError.message : folderToast("failed"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteFolder() {
    if (!folderPendingDelete) return;
    const target = folderPendingDelete;
    setFolderPendingDelete(null);
    try {
      setBusy(true);
      await deleteFileFolder(target.id);
      if (currentFolderId === target.id) openFolder(target.parentId);
      await reloadAll();
      toast.success(folderToast("deleted", { name: target.name }));
    } catch (folderError) {
      toast.error(folderError instanceof Error ? folderError.message : folderToast("failed"));
    } finally {
      setBusy(false);
    }
  }

  /** Di chuyển file/thư mục; dùng cho dialog, thao tác hàng loạt và kéo thả. */
  async function moveItems(items: { fileIds: string[]; folderIds: string[] }, targetFolderId: string | null) {
    if (!items.fileIds.length && !items.folderIds.length) return false;
    try {
      setBusy(true);
      await moveFileItems({ ...items, targetFolderId });
      const targetName = targetFolderId ? folders.find((folder) => folder.id === targetFolderId)?.name : null;
      toast.success(
        targetName
          ? folderToast("moved", { count: items.fileIds.length + items.folderIds.length, name: targetName })
          : folderToast("movedToRoot", { count: items.fileIds.length + items.folderIds.length }),
      );
      setSelectedIds((current) => new Set([...current].filter((id) => !items.fileIds.includes(id))));
      await reloadAll();
      return true;
    } catch (moveError) {
      toast.error(moveError instanceof Error ? moveError.message : folderToast("moveFailed"));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirmMove(targetFolderId: string | null) {
    if (!moveRequest) return;
    const moved = await moveItems(moveRequest, targetFolderId);
    if (moved) setMoveRequest(null);
  }

  // Thư mục đang mở không còn (vd. bị xóa ở tab khác) thì quay về gốc.
  const currentFolder = currentFolderId ? folders.find((folder) => folder.id === currentFolderId) ?? null : null;
  const openingFolder = !searching && loadedFolderId !== undefined && loadedFolderId !== currentFolderId;

  return {
    folders, currentFolderId, currentFolder, searching, openingFolder, loadedFolderId, folderDialog, folderPendingDelete, moveRequest,
    openFolder, setFolderDialog, saveFolder, setFolderPendingDelete, confirmDeleteFolder, setMoveRequest, confirmMove, moveItems,
    files, visibleFiles, filteredTotal: totalItems, totalSize, storageLimit, storageBoosted, reservedSize, fileSizeLimit, query, filters, sort, page: Math.min(page, pageCount), pageSize, pageCount, loading, error,
    selectedIds, selectedFiles, busy, uploadOpen, uploadQueue, previewFile, previewOpen, filePendingRename, filePendingDelete, bulkDeleteOpen,
    setQuery, setType, setSort, setPage, setPageSize, clearCriteria, refresh: loadFiles,
    setUploadOpen, addFiles, retryUpload, cancelUpload, removeUpload, openPreview, setPreviewOpen, downloadFile, openRename, setFilePendingRename, renameFile,
    setFilePendingDelete, confirmDelete, setBulkDeleteOpen, confirmBulkDelete, selectFile, selectPage, clearSelection,
  };
}
