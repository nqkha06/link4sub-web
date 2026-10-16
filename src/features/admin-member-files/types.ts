export type AdminFileType = "image" | "video" | "audio" | "document" | "archive" | "other";
export type AdminFileState = "active" | "trash" | "all";

export const ADMIN_FILE_TYPES: AdminFileType[] = ["image", "video", "audio", "document", "archive", "other"];
export const ADMIN_FILE_STATES: AdminFileState[] = ["active", "trash", "all"];

export type AdminMemberFile = {
  id: number;
  alias: string;
  name: string;
  originalName: string;
  extension: string | null;
  mimeType: string;
  previewUrl: string;
  size: number;
  purpose: string;
  status: string;
  downloadCount: number;
  /** Social links using this file as their destination. */
  usageCount: number;
  owner: { id: number; name: string; email: string };
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AdminMemberFilesSummary = {
  activeFiles: number;
  activeBytes: number;
  trashedFiles: number;
  trashedBytes: number;
};

export type AdminMemberFilesResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminMemberFile>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    summary?: AdminMemberFilesSummary;
  };
};

export type AdminMemberFilesTableData = {
  data: AdminMemberFile[];
  total: number;
  pageCount: number;
  summary: AdminMemberFilesSummary;
};
