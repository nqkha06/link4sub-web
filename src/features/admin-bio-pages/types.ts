export type BioPageStatus = "published" | "draft";

export type AdminBioPageOwner = {
  id: number;
  name: string;
  email: string;
};

export type AdminBioPageContentSummary = {
  socialLinks: number;
  customLinks: number;
  widgets: number;
  galleries: number;
  dividers: number;
  bankDetails: number;
  textBlocks: number;
};

export type AdminBioPageListItem = {
  id: number;
  slug: string;
  publicUrl: string;
  name: string;
  title: string | null;
  status: BioPageStatus;
  views: number;
  clicks: number;
  owner: AdminBioPageOwner | null;
  contentSummary: AdminBioPageContentSummary;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminBioPagesResponse = Omit<
  import("@/contracts").PaginatedApiResponse<AdminBioPageListItem>,
  "meta"
> & {
  meta: import("@/contracts").PaginationMeta & {
    summary: AdminBioPagesSummary;
  };
};

export type AdminBioPagesSummary = { published: number; draft: number };

export type AdminBioPagesTableData = {
  data: AdminBioPageListItem[];
  total: number;
  pageCount: number;
  summary: AdminBioPagesSummary;
};
