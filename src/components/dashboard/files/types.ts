import type { ManagedFileDto } from "@/lib/api-client";

export type FileTypeFilter = "all" | "image" | "video" | "audio" | "document" | "archive" | "other";
export type FileStatusFilter = "all" | "ready" | "processing" | "failed";
export type FileSortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "size-desc" | "size-asc";

export type UploadQueueStatus =
  | "pending"
  | "uploading"
  | "finalizing"
  | "success"
  | "error"
  | "cancelled";

export type UploadQueueItem = {
  id: string;
  file: File;
  status: UploadQueueStatus;
  progress: number;
  indeterminate: boolean;
  /** Thư mục đang mở lúc chọn file; null = gốc. */
  folderId?: string | null;
  /** Lỗi từ server/mạng có thể thử lại; lỗi kiểm tra file phía client thì không. */
  retryable?: boolean;
  error?: string;
};

export type ManagedFileView = ManagedFileDto & {
  usageCount: number | null;
};

export type FilesFilters = {
  type: FileTypeFilter;
  status: FileStatusFilter;
};
