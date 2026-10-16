export type LinkReportStatus =
  | "pending"
  | "reviewing"
  | "resolved"
  | "dismissed";

export type LinkReportReason =
  | "spam"
  | "malware"
  | "impersonation"
  | "copyright"
  | "adult"
  | "other";

export type LinkReportReviewer = {
  id: number;
  name: string;
  email: string;
};

export type AdminLinkReportListItem = {
  id: number;
  reference: string;
  email: string;
  reportedUrl: string;
  reason: LinkReportReason;
  status: LinkReportStatus;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy: LinkReportReviewer | null;
};

export type AdminLinkReport = AdminLinkReportListItem & {
  details: string;
  reviewedById: number | null;
  deletedAt: string | null;
};

export type AdminLinkReportsResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminLinkReportListItem>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    summary: Record<LinkReportStatus, number>;
  };
};

export type AdminLinkReportsTableData = {
  data: AdminLinkReportListItem[];
  total: number;
  pageCount: number;
  summary: Record<LinkReportStatus, number>;
};
