import "server-only";

import { DEFAULT_SITE_ICON_URLS } from "./default-site-brand";
import { LOCAL_SITE_ICON_FILES } from "./local-site-icon-pipeline";
import { localSiteIconResponse } from "./local-site-icons";

/**
 * `/favicon.ico`, `/apple-touch-icon.png`: Safari/Chrome iOS gọi thẳng các
 * đường dẫn này. File được đọc trực tiếp từ ổ bền vững của stu-web; không gọi
 * API và không proxy tới object storage.
 */
export async function siteIconResponse(kind: "favicon" | "apple", request: Request) {
  const response = await localSiteIconResponse(
    kind === "favicon"
      ? LOCAL_SITE_ICON_FILES.faviconIco
      : LOCAL_SITE_ICON_FILES.appleTouchIcon,
    request,
  );
  if (response.status !== 404) return response;

  return Response.redirect(
    new URL(
      kind === "favicon"
        ? DEFAULT_SITE_ICON_URLS.faviconIco
        : DEFAULT_SITE_ICON_URLS.appleTouchIcon,
      request.url,
    ),
    307,
  );
}
