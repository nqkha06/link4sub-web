export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type PageFeaturedImage = {
  id: number;
  fileName: string;
  mimeType: string;
  extension: string;
  url: string;
};

export type PageTranslation = {
  locale: string;
  title: string | null;
  excerpt: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
};

export type PageTranslationPayload = Pick<PageTranslation, "locale"> &
  Partial<Omit<PageTranslation, "locale">>;

export type AdminPage = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  status: PageStatus;
  featuredImageId: number | null;
  featuredImage: PageFeaturedImage | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  sortOrder: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: PageTranslation[];
};

export type AdminPageListItem = Omit<
  AdminPage,
  "contentJson" | "contentHtml" | "translations"
> & { translationLocales: string[] };

export type AdminPagePayload = {
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: Record<string, unknown>;
  contentHtml: string;
  featuredImageId: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  canonicalUrl: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  sortOrder: number;
  status?: PageStatus;
  translations?: PageTranslationPayload[];
};

import type { PaginatedApiResponse } from "@/contracts";

export type AdminPagesResponse = PaginatedApiResponse<AdminPageListItem>;

export type AdminPagesTableData = {
  data: AdminPageListItem[];
  pageCount: number;
  total: number;
};
