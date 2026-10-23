import {
  isTerminalAuthError,
  readAuthError,
} from "@/lib/auth/auth-errors";
import { logoutAndRedirect } from "@/features/auth/api/auth.client";
import { getServerConfig } from "@/config/server";
import {
  getApiErrorMessageFromText,
  readApiData,
  readPaginatedApiResponse,
  type PaginatedApiResponse,
  type PaginationMeta,
} from "@/lib/api-response";
import type { BioDesign } from "@/contracts";
import { getUploadMimeType } from "@/lib/upload-compatibility";
import { UploadError, uploadPart, withUploadDeadline } from "@/lib/upload-request";

const BROWSER_API_URL = "/api/backend";

export type LinkActionDto = {
  id?: string;
  platform: string;
  action: string;
  url: string;
  watchDurationSeconds?: number | null;
  label?: string;
  icon?: import("@/contracts").MonetizationActionIconKey;
  position?: number;
  monetization?: {
    adId: string;
    priority?: number;
    weight?: number;
    cooldownMinutes: number;
    cooldownBehavior: "replace" | "hide";
    cooldownScope: "visitor" | "link";
    displayMode: "all" | "sequential";
    rotationGroup?: string;
    rotationRank: number;
  };
};

/** `allowed`: hạng Loyalty hiện tại có quyền dùng API hay không. */
export type MemberApiKeyStatus =
  | { active: false; allowed?: boolean }
  | {
      active: true;
      allowed?: boolean;
      id: number;
      name: string;
      keyPrefix: string;
      /** null với key cũ chỉ còn bản băm, không hiển thị lại được. */
      apiKey: string | null;
      lastUsedAt: string | null;
      createdAt: string;
    };

export type IssuedMemberApiKey = {
  id: number;
  name: string;
  keyPrefix: string;
  apiKey: string;
  createdAt: string;
};

export type PublicMonetizationAdDto = {
  id: string;
  format: string;
  placement: string;
  priority: number;
  weight: number;
  content: {
    targetUrl?: string;
    html?: string;
    css?: string;
    javascript?: string;
    height?: number;
  };
};

export type LinkDto = {
  id: string;
  slug: string;
  shortUrl: string;
  destinationUrl: string;
  /** True when the snippet destination was deleted by its owner. */
  destinationDeleted?: boolean;
  title: string;
  inputType: string;
  selectedSnippet: string | null;
  selectedFile: string | null;
  destinationFileName: string | null;
  subtitle: string | null;
  customAlias: string | null;
  coverImageUrl: string | null;
  expiryEnabled: boolean;
  expiryType: string | null;
  expiryDate: string | null;
  expiryTime: string | null;
  maxClicks: number | null;
  views: number;
  revenue: string;
  status: string;
  monetizationRedirectUrl?: string | null;
  monetizationAds?: PublicMonetizationAdDto[];
  visitToken?: string | null;
  showConfig?: {
    pageCount: number;
  };
  relatedLinks?: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    inputType: string;
    coverImageUrl: string | null;
    views: number;
    createdAt: string;
  }>;
  actions: LinkActionDto[];
  backgroundSettings: {
    selectedBackgroundId: string | null;
    selectedBackgroundName: string | null;
    backgroundMediaType: "image" | "video" | "youtube" | null;
    backgroundMediaUrl: string | null;
    sameAsCoverImage: boolean;
    effects: {
      opacity: number;
      blur: number;
      saturation: number;
      contrast: number;
      grayscale: number;
    };
  };
  createdAt: string;
  updatedAt: string;
};

export type LinkVisitorContext = {
  countryCode?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  referrer?: string | null;
  pageContext?: {
    postType?: string | null;
    categoryIds?: number[];
    niches?: string[];
    placements?: string[];
  };
};

export type ManagedFileDto = {
  id: string;
  alias: string;
  name: string;
  originalName: string;
  extension: string | null;
  mimeType: string;
  previewUrl: string;
  size: number;
  sizeLabel: string;
  downloadCount: number;
  status: string;
  purpose: "file" | "cover";
  usageCount: number;
  /** Thư mục chứa file; null = thư mục gốc. */
  folderId: string | null;
  folderName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type FileFolderDto = {
  id: string;
  name: string;
  parentId: string | null;
  fileCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
};

export type SnippetDto = {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type SnippetsResponseDto = PaginatedApiResponse<SnippetDto>;

export type DestinationUsageDto = {
  total: number;
  links: Array<{ id: string; slug: string; title: string; status: string }>;
};

export type SnippetUsageDto = DestinationUsageDto;

export type FilesResponseDto = Omit<PaginatedApiResponse<ManagedFileDto>, "meta"> & {
  meta: PaginationMeta & {
    summary: {
    usedBytes: number;
    reservedBytes: number;
    limitBytes: number;
    tierBoosted?: boolean;
    };
  };
};

export type BioSocialLinkDto = {
  id: string;
  platform: string;
  url: string;
  enabled?: boolean;
};

export type BioCustomLinkDto = {
  kind?: "link" | "download";
  fileId?: string | null;
  description?: string;
  buttonText?: string;
  downloadFile?: { name: string; mimeType: string; size: number };
  id: string;
  title: string;
  url: string;
  animationEffect?: LinkAnimationEffect;
  iconFileId?: string;
  iconUrl?: string;
};

export type LinkAnimationEffect =
  | "none"
  | "pulse"
  | "shake"
  | "bounce"
  | "glow"
  | "aura-gold"
  | "aura-rainbow"
  | "aura-holo"
  | "aura-mono";


export type BioWidgetDto = {
  id: string;
  type: string;
  title: string;
  url: string;
  description?: string;
  enabled?: boolean;
};

export type BioGalleryImageDto = {
  id: string;
  fileId: string;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
  caption?: string;
  linkUrl?: string;
  openInNewTab?: boolean;
  sortOrder: number;
  width?: number;
  height?: number;
};

export type BioGalleryBlockDto = {
  id: string;
  type: "gallery";
  title?: string;
  enabled: boolean;
  showTitle: boolean;
  displayMode: "grid" | "slider";
  aspectRatio: "1:1" | "4:5" | "16:9" | "original";
  columns: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap: "sm" | "md" | "lg";
  radius: "none" | "sm" | "md" | "lg" | "full";
  showCaption: boolean;
  border: "none" | "subtle";
  shadow: "none" | "sm" | "md";
  images: BioGalleryImageDto[];
};

export type BioDividerBlockDto = {
  id: string;
  type: "divider";
  enabled: boolean;
  label?: string;
  showLabel: boolean;
  style: "solid" | "dashed" | "dotted";
  spacing: "sm" | "md" | "lg";
};

export type BioBankDetailsBlockDto = {
  id: string;
  type: "bank-details";
  enabled: boolean;
  title: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  note?: string;
  showCopyButton: boolean;
};

export type BioTextBlockDto = {
  id: string;
  type: "text";
  enabled: boolean;
  style: "heading" | "subheading" | "paragraph";
  align: "left" | "center" | "right";
  content: string;
};

export type BioContentOrderItemDto = {
  type: "link" | "widget" | "gallery" | "social" | "divider" | "bank-details" | "text";
  id: string;
};

export type BioAppearanceDto = {
  buttonStyle: string;
  backgroundColor: string;
  backgroundImage?: string | null;
  backgroundMediaType?: "image" | "video" | "youtube" | null;
  backgroundMediaUrl?: string | null;
  backgroundFileId?: string | null;
  selectedBackgroundId?: string | null;
  avatarFileId?: string | null;
  avatarUrl?: string | null;
  backgroundBlur?: number | null;
  backgroundOverlay?: number | null;
  backgroundBrightness?: number | null;
};

export type BioPageDto = {
  id: number;
  slug: string;
  publicUrl: string;
  name: string;
  title: string | null;
  status: string;
  views: number;
  clicks: number;
  socialLinks: BioSocialLinkDto[];
  customLinks: BioCustomLinkDto[];
  widgets: BioWidgetDto[];
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  textBlocks: BioTextBlockDto[];
  contentOrder: BioContentOrderItemDto[];
  hiddenLinks: string[];
  appearance: BioAppearanceDto;
  design: BioDesign;
  hasDesign: boolean;
  designAssets: {
    backgroundImageUrl?: string;
    backgroundVideoUrl?: string;
    backgroundFallbackUrl?: string;
    backgroundMobileUrl?: string;
    videoPosterUrl?: string;
    cursorUrl?: string;
    enterBackgroundUrl?: string;
    musicUrl?: string;
    musicCoverUrl?: string;
    /** Danh sách nhạc đã có URL (dùng cho "Shuffle Audios"). */
    musicTracks?: Array<{ assetId: string; title: string; url: string }>;
    clickSoundUrl?: string;
    hoverSoundUrl?: string;
    enterSoundUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type CreateBioPagePayload = {
  name: string;
  title?: string;
  customSlug?: string;
  status?: "published" | "draft";
  socialLinks: BioSocialLinkDto[];
  customLinks: BioCustomLinkDto[];
  widgets: BioWidgetDto[];
  galleries: BioGalleryBlockDto[];
  dividers: BioDividerBlockDto[];
  bankDetails: BioBankDetailsBlockDto[];
  textBlocks: BioTextBlockDto[];
  contentOrder: BioContentOrderItemDto[];
  hiddenLinks: string[];
  appearance: Omit<BioAppearanceDto, "avatarUrl">;
  design?: BioDesign;
};

export type CreateLinkPayload = {
  destinationUrl: string;
  title?: string;
  inputType: "url" | "file" | "snippet";
  selectedSnippet?: string;
  selectedFile?: string;
  subtitle?: string;
  customAlias?: string;
  coverImageUrl?: string;
  expiryEnabled?: boolean;
  expiryType?: "date" | "clicks";
  expiryDate?: string;
  expiryTime?: string;
  maxClicks?: number;
  actions: LinkActionDto[];
  backgroundSettings?: {
    selectedBackgroundId?: string;
    selectedBackgroundName?: string;
    backgroundMediaType?: "image" | "video" | "youtube";
    backgroundMediaUrl?: string;
    sameAsCoverImage?: boolean;
    effects?: {
      opacity?: number;
      blur?: number;
      saturation?: number;
      contrast?: number;
      grayscale?: number;
    };
  };
};

function normalizeApiPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

// Shared secret nội bộ giữa stu-web (server-side) và stu-api. Chỉ đọc
// được ở server (route handler / server component) — trên trình duyệt
// biến này luôn undefined nên header sẽ tự bỏ qua, không có rủi ro lộ secret.
function internalSecretHeaders(): Record<string, string> {
  const secret = getServerConfig().internalApiSecret;
  return secret ? { "x-internal-secret": secret } : {};
}

function requestApiUrl(path: string) {
  if (typeof window !== "undefined") {
    return browserApiUrl(path);
  }

  const serverApiUrl = getServerConfig().apiInternalUrl;
  if (!serverApiUrl) {
    throw new Error("Missing API_URL environment variable.");
  }

  return `${serverApiUrl}${normalizeApiPath(path)}`;
}

function browserApiUrl(path: string) {
  return `${BROWSER_API_URL}${normalizeApiPath(path)}`;
}

async function endExpiredSession(reason?: string) {
  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  const searchParams = new URLSearchParams({ callbackUrl });
  if (reason) searchParams.set("reason", reason);
  await logoutAndRedirect(`/login?${searchParams.toString()}`);
}

export async function authenticatedApiFetch(path: string, init: RequestInit = {}) {
  if (typeof window === "undefined") {
    throw new Error(
      "Client API functions must call the Next.js BFF from the browser.",
    );
  }

  const response = await fetch(requestApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
  if (response.status === 401) {
    const authError = await readAuthError(response);
    if (isTerminalAuthError(authError.code)) {
      await endExpiredSession("session-expired");
    }
  }
  return response;
}

export async function authenticatedApiRequest<T>(
  path: string,
  init: RequestInit = {},
) {
  return readApiData<T>(await authenticatedApiFetch(path, init));
}

export async function authenticatedPaginatedApiRequest<T>(
  path: string,
  init: RequestInit = {},
) {
  return readPaginatedApiResponse<T>(await authenticatedApiFetch(path, init));
}

export async function createLink(payload: CreateLinkPayload) {
  const response = await authenticatedApiFetch("/links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiData<LinkDto>(response);
}

export async function getMemberApiKeyStatus() {
  const response = await authenticatedApiFetch("/member/api/key", {
    cache: "no-store",
  });

  return readApiData<MemberApiKeyStatus>(response);
}

export async function issueMemberApiKey() {
  const response = await authenticatedApiFetch("/member/api/key", {
    method: "POST",
  });

  return readApiData<IssuedMemberApiKey>(response);
}

export async function revokeMemberApiKey() {
  const response = await authenticatedApiFetch("/member/api/key", {
    method: "DELETE",
  });

  return readApiData<{ revoked: boolean }>(response);
}

export async function updateLink(id: string, payload: CreateLinkPayload) {
  const response = await authenticatedApiFetch(`/links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiData<LinkDto>(response);
}

export async function getLinks() {
  const response = await authenticatedApiFetch("/links", {
    cache: "no-store",
  });

  return readApiData<LinkDto[]>(response);
}

export async function checkLinkAliasAvailability(alias: string) {
  const searchParams = new URLSearchParams({
    alias,
  });
  const response = await authenticatedApiFetch(`/links/alias/check?${searchParams.toString()}`, {
    cache: "no-store",
  });

  return readApiData<{
    alias: string;
    available: boolean;
  }>(response);
}

export async function updateLinkStatus(
  id: string,
  status: "active" | "inactive" | "paused",
) {
  const response = await authenticatedApiFetch(`/links/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  return readApiData<LinkDto>(response);
}

export async function deleteLink(id: string) {
  const response = await authenticatedApiFetch(`/links/${id}`, {
    method: "DELETE",
  });

  return readApiData<{ id: string; deleted: true }>(response);
}

export async function getSnippets() {
  const snippets: SnippetDto[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const searchParams = new URLSearchParams({
      page: String(page),
      limit: "100",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const response = await authenticatedApiFetch(
      `/member/snippets?${searchParams.toString()}`,
      { cache: "no-store" },
    );

    const result = await readPaginatedApiResponse<SnippetDto>(response);
    snippets.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return snippets;
}

export async function createSnippet(payload: { name?: string; content: string }) {
  const response = await authenticatedApiFetch("/member/snippets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiData<SnippetDto>(response);
}

export async function updateSnippet(
  id: string,
  payload: { name?: string; content?: string },
) {
  const response = await authenticatedApiFetch(`/member/snippets/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readApiData<SnippetDto>(response);
}

export async function deleteSnippet(id: string) {
  const response = await authenticatedApiFetch(`/member/snippets/${id}`, {
    method: "DELETE",
  });

  await readApiData<{ id: string; deleted: true }>(response);
}

export async function getSnippetUsage(id: string) {
  const response = await authenticatedApiFetch(`/member/snippets/${id}/usage`, {
    cache: "no-store",
  });

  return readApiData<SnippetUsageDto>(response);
}

export async function getSnippetsPage(params?: {
  search?: string;
  sortBy?: "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.search) searchParams.set("search", params.search);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const response = await authenticatedApiFetch(
    `/member/snippets?${searchParams.toString()}`,
    { cache: "no-store" },
  );

  return readPaginatedApiResponse<SnippetDto>(response);
}

export async function getLink(slug: string) {
  const response = await fetch(requestApiUrl(`/links/${slug}`), {
    cache: "no-store",
    credentials: "include",
  });

  return readApiData<LinkDto>(response);
}

export async function recordLinkVisit(
  slug: string,
  visitor: LinkVisitorContext = {},
) {
  const headers = new Headers(internalSecretHeaders());
  if (visitor.countryCode) {
    headers.set("x-visitor-country", visitor.countryCode);
  }
  if (visitor.userAgent) {
    headers.set("user-agent", visitor.userAgent);
  }
  if (visitor.ipAddress) {
    headers.set("x-visitor-ip", visitor.ipAddress);
  }
  if (visitor.referrer) {
    headers.set("referer", visitor.referrer);
  }
  headers.set("content-type", "application/json");
  const response = await fetch(
    requestApiUrl(`/links/${encodeURIComponent(slug)}/visit`),
    {
      method: "POST",
      headers,
      body: JSON.stringify(visitor.pageContext ?? {}),
      cache: "no-store",
      credentials: "include",
    },
  );

  return readApiData<LinkDto>(response);
}

export async function completeLinkVisit(
  slug: string,
  visitToken: string,
  completion: {
    ipAddress?: string | null;
    deviceId?: string | null;
    adBlockDetected?: boolean;
  } = {},
) {
  const headers = new Headers({
    ...internalSecretHeaders(),
    "Content-Type": "application/json",
  });
  if (completion.ipAddress) {
    headers.set("x-visitor-ip", completion.ipAddress);
  }
  const response = await fetch(
    requestApiUrl(
      `/links/${encodeURIComponent(slug)}/visit/${encodeURIComponent(visitToken)}/complete`,
    ),
    {
      method: "POST",
      headers,
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({
        deviceId: completion.deviceId || undefined,
        adBlockDetected: Boolean(completion.adBlockDetected),
      }),
    },
  );

  return readApiData<LinkDto>(response);
}

export async function completePublicLinkVisit(
  slug: string,
  visitToken: string,
  completion: { deviceId?: string | null; adBlockDetected?: boolean } = {},
) {
  const searchParams = new URLSearchParams({ visitToken });
  if (completion.deviceId) {
    searchParams.set("deviceId", completion.deviceId);
  }
  if (completion.adBlockDetected) {
    searchParams.set("adBlockDetected", "1");
  }
  const response = await fetch(
    `/api/public/links/${encodeURIComponent(slug)}?${searchParams.toString()}`,
    {
      method: "GET",
      cache: "no-store",
      keepalive: true,
    },
  );

  return readApiData<LinkDto>(response);
}

export async function getFiles(params?: {
  q?: string;
  sort?: "date" | "name" | "size" | "downloads";
  direction?: "asc" | "desc";
  status?: "active" | "trash";
  type?: "image" | "video" | "audio" | "document" | "archive" | "other";
  state?: "ready" | "processing" | "failed";
  /** "root" = thư mục gốc, id = một thư mục; bỏ trống = mọi thư mục. */
  folderId?: string;
  page?: number;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (params?.folderId) searchParams.set("folderId", params.folderId);

  if (params?.q) {
    searchParams.set("q", params.q);
  }

  if (params?.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params?.direction) {
    searchParams.set("direction", params.direction);
  }

  if (params?.status) {
    searchParams.set("status", params.status);
  }

  if (params?.type) searchParams.set("type", params.type);
  if (params?.state) searchParams.set("state", params.state);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const response = await fetch(
    requestApiUrl(`/member/files${query ? `?${query}` : ""}`),
    {
      cache: "no-store",
      credentials: "include",
    },
  );

  return readPaginatedApiResponse<ManagedFileDto>(response) as Promise<FilesResponseDto>;
}

export async function uploadFile(
  file: File,
  options?: {
    purpose?: "file" | "cover";
    /** Thư mục nhận file; null/bỏ trống = thư mục gốc. */
    folderId?: string | null;
    signal?: AbortSignal;
    onProgress?: (progress: number) => void;
    onFinalizing?: () => void;
  },
) {
  if (file.size === 0) throw new UploadError("emptyFile");
  options?.onProgress?.(0);

  const upload = await withUploadDeadline(async (signal) => {
    const initiateResponse = await fetch(requestApiUrl("/member/files/multipart"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: getUploadMimeType(file) || "application/octet-stream",
        size: file.size,
        purpose: options?.purpose || "file",
      }),
      signal,
    });

    return readApiData<{
      uploadId: string;
      partSize: number;
      totalParts: number;
    }>(initiateResponse);
  }, options?.signal);
  const uploadId = upload.uploadId;
  let completionStarted = false;

  try {
    for (let partNumber = 1; partNumber <= upload.totalParts; partNumber += 1) {
      const start = (partNumber - 1) * upload.partSize;
      const end = Math.min(start + upload.partSize, file.size);
      const chunk = file.slice(start, end);

      await uploadPart(
        requestApiUrl(`/member/files/multipart/${uploadId}/parts/${partNumber}`),
        chunk,
        options?.signal,
        (loaded) => {
          const uploadedBytes = start + Math.min(loaded, chunk.size);
          options?.onProgress?.(Math.min(99, Math.round((uploadedBytes / file.size) * 100)));
        },
        getApiErrorMessageFromText,
      );
    }

    options?.onFinalizing?.();

    options?.signal?.throwIfAborted();
    completionStarted = true;
    const completed = await withUploadDeadline(async (signal) => {
      const completeResponse = await fetch(
        requestApiUrl(`/member/files/multipart/${upload.uploadId}/complete`),
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options?.folderId ? { folderId: options.folderId } : {}),
          signal,
        },
      );
      return readApiData<ManagedFileDto>(completeResponse);
    }, options?.signal);

    options?.onProgress?.(100);
    return completed;
  } catch (error) {
    // A lost completion response does not mean the server failed. Deleting then
    // could race with completion and remove a successfully stored file.
    if (!completionStarted) void withUploadDeadline((signal) => fetch(requestApiUrl(`/member/files/multipart/${uploadId}`), {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
      signal,
    }), undefined, 10_000).catch(() => undefined);
    throw error;
  }
}

export async function updateFile(
  id: string,
  payload: {
    name?: string;
  },
) {
  const response = await fetch(requestApiUrl(`/member/files/${id}`), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<ManagedFileDto>(response);
}

/**
 * Điều hướng qua BFF để kiểm quyền; API redirect sang presigned R2 URL nên
 * browser tải thẳng từ R2 và tự hiển thị tiến trình trong download manager.
 */
export function downloadMemberFile(id: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = browserApiUrl(`/member/files/${id}/download`);
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function deleteFile(id: string) {
  const response = await fetch(requestApiUrl(`/member/files/${id}`), {
    method: "DELETE",
    credentials: "include",
  });

  return readApiData<ManagedFileDto>(response);
}

export async function getFilesUsage(ids: string[]) {
  const response = await fetch(requestApiUrl("/member/files/usage"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return readApiData<DestinationUsageDto>(response);
}

export async function bulkDeleteFiles(ids: string[]) {
  const response = await fetch(requestApiUrl("/member/files/bulk-delete"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
  return readApiData<{ ids: string[]; deleted: true }>(response);
}

export async function getFileFolders() {
  const response = await fetch(requestApiUrl("/member/files/folders"), {
    cache: "no-store",
    credentials: "include",
  });
  return readApiData<FileFolderDto[]>(response);
}

export async function createFileFolder(name: string, parentId: string | null) {
  const response = await fetch(requestApiUrl("/member/files/folders"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, parentId }),
  });
  return readApiData<FileFolderDto>(response);
}

export async function renameFileFolder(id: string, name: string) {
  const response = await fetch(requestApiUrl(`/member/files/folders/${id}`), {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  return readApiData<FileFolderDto>(response);
}

export async function deleteFileFolder(id: string) {
  const response = await fetch(requestApiUrl(`/member/files/folders/${id}`), {
    method: "DELETE",
    credentials: "include",
  });
  return readApiData<{ id: string; deleted: true; movedFiles: number; movedFolders: number }>(response);
}

export async function moveFileItems(payload: {
  fileIds?: string[];
  folderIds?: string[];
  targetFolderId: string | null;
}) {
  const response = await fetch(requestApiUrl("/member/files/move"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return readApiData<{ targetFolderId: string | null; movedFiles: number; movedFolders: number }>(response);
}

export function getFilePreviewUrl(file: Pick<ManagedFileDto, "previewUrl">) {
  return file.previewUrl;
}

export async function createBioPage(payload: CreateBioPagePayload) {
  const response = await authenticatedApiFetch("/member/bio-pages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<BioPageDto>(response);
}

export async function updateBioPage(id: number, payload: CreateBioPagePayload) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readApiData<BioPageDto>(response);
}

export async function getBioPages() {
  const response = await authenticatedApiFetch("/member/bio-pages", {
    cache: "no-store",
  });

  return readApiData<BioPageDto[]>(response);
}

export async function getBioPageById(id: number) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    cache: "no-store",
  });

  return readApiData<BioPageDto>(response);
}

export async function deleteBioPage(id: number) {
  const response = await authenticatedApiFetch(`/member/bio-pages/${id}`, {
    method: "DELETE",
  });

  return readApiData<{ id: number; deleted: true }>(response);
}

export async function getBioPage(slug: string) {
  const response = await fetch(requestApiUrl(`/public/bio-pages/${slug}`), {
    cache: "no-store",
  });

  return readApiData<BioPageDto>(response);
}

export async function trackBioClick(slug: string) {
  const response = await fetch(requestApiUrl(`/public/bio-pages/${slug}/click`), {
    method: "POST",
  });

  return readApiData<{ clicks: number }>(response);
}
