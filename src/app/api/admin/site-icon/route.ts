import { revalidatePath } from "next/cache";

import { getServerConfig } from "@/config/server";
import type { AuthUser } from "@/features/auth/types";
import { apiJsonError, apiJsonSuccess } from "@/lib/api-route-response";
import { readApiData } from "@/lib/api-response";
import { serverApiFetch } from "@/lib/auth/server-api";
import {
  getLocalSiteIconInfo,
  InvalidLocalSiteIconError,
  localSiteIconUrl,
  removeLocalSiteIcons,
  saveLocalSiteIcons,
} from "@/lib/branding/local-site-icons";
import { LOCAL_SITE_ICON_FILES } from "@/lib/branding/local-site-icon-pipeline";
import { isTrustedBrowserRequest } from "@/lib/trusted-browser-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const MAX_MULTIPART_BYTES = MAX_SOURCE_BYTES + 1024 * 1024;
const SOURCE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type IconState = {
  configured: boolean;
  version: string | null;
  updatedAt: string | null;
  faviconUrl: string | null;
};

function iconState(
  info: Awaited<ReturnType<typeof getLocalSiteIconInfo>>,
): IconState {
  return info
    ? {
        configured: true,
        version: info.version,
        updatedAt: info.updatedAt,
        faviconUrl: localSiteIconUrl(
          LOCAL_SITE_ICON_FILES.faviconIco,
          info.version,
        ),
      }
    : {
        configured: false,
        version: null,
        updatedAt: null,
        faviconUrl: null,
      };
}

async function authorize(permission: "settings.read" | "settings.update") {
  try {
    const response = await serverApiFetch("/auth/me", { cache: "no-store" });
    if (!response.ok) {
      return {
        error: apiJsonError(
          response.status === 401 ? 401 : 503,
          response.status === 401 ? "UNAUTHENTICATED" : "AUTH_SERVICE_UNAVAILABLE",
          response.status === 401
            ? "Phiên đăng nhập đã hết hạn."
            : "Không thể xác minh quyền quản trị.",
        ),
      };
    }
    const user = await readApiData<AuthUser>(response);
    if (!user.permissions.includes("admin.access") || !user.permissions.includes(permission)) {
      return {
        error: apiJsonError(
          403,
          "FORBIDDEN",
          "Bạn không có quyền thay đổi favicon.",
        ),
      };
    }
    return { error: null };
  } catch {
    return {
      error: apiJsonError(
        503,
        "AUTH_SERVICE_UNAVAILABLE",
        "Không thể xác minh quyền quản trị.",
      ),
    };
  }
}

export async function GET() {
  const authorization = await authorize("settings.read");
  if (authorization.error) return authorization.error;
  return apiJsonSuccess(
    iconState(await getLocalSiteIconInfo()),
    "Đã tải trạng thái favicon.",
  );
}

export async function POST(request: Request) {
  if (!isTrustedBrowserRequest(request, getServerConfig().webUrl)) {
    return apiJsonError(403, "UNTRUSTED_ORIGIN", "Nguồn yêu cầu không hợp lệ.");
  }
  const authorization = await authorize("settings.update");
  if (authorization.error) return authorization.error;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_MULTIPART_BYTES) {
    return apiJsonError(413, "FILE_TOO_LARGE", "Ảnh favicon tối đa 5 MB.");
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("favicon");
  } catch {
    return apiJsonError(400, "INVALID_MULTIPART", "Dữ liệu upload không hợp lệ.");
  }
  if (!(file instanceof File) || file.size === 0) {
    return apiJsonError(400, "FILE_REQUIRED", "Hãy chọn một ảnh favicon.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    return apiJsonError(413, "FILE_TOO_LARGE", "Ảnh favicon tối đa 5 MB.");
  }
  if (!SOURCE_MIME_TYPES.has(file.type.toLowerCase())) {
    return apiJsonError(
      400,
      "INVALID_FILE_TYPE",
      "Favicon chỉ nhận PNG, JPEG hoặc WebP.",
    );
  }

  try {
    const info = await saveLocalSiteIcons(Buffer.from(await file.arrayBuffer()));
    revalidatePath("/", "layout");
    revalidatePath("/manifest.webmanifest");
    return apiJsonSuccess(iconState(info), "Đã cập nhật favicon.");
  } catch (error) {
    if (error instanceof InvalidLocalSiteIconError) {
      return apiJsonError(
        400,
        "INVALID_IMAGE",
        "Không thể đọc ảnh favicon. Hãy chọn ảnh PNG, JPEG hoặc WebP hợp lệ.",
      );
    }
    return apiJsonError(
      500,
      "SITE_ICON_WRITE_FAILED",
      "Không thể lưu favicon trên máy chủ Web.",
    );
  }
}

export async function DELETE(request: Request) {
  if (!isTrustedBrowserRequest(request, getServerConfig().webUrl)) {
    return apiJsonError(403, "UNTRUSTED_ORIGIN", "Nguồn yêu cầu không hợp lệ.");
  }
  const authorization = await authorize("settings.update");
  if (authorization.error) return authorization.error;
  try {
    await removeLocalSiteIcons();
  } catch {
    return apiJsonError(
      500,
      "SITE_ICON_DELETE_FAILED",
      "Không thể xóa favicon trên máy chủ Web.",
    );
  }
  revalidatePath("/", "layout");
  revalidatePath("/manifest.webmanifest");
  return apiJsonSuccess(iconState(null), "Đã xóa favicon.");
}
