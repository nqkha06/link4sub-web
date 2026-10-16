import "server-only";

import { LOCAL_SITE_ICON_FILES } from "./local-site-icon-pipeline";
import { localSiteIconResponse } from "./local-site-icons";

/**
 * `/favicon.ico`, `/apple-touch-icon.png`: Safari/Chrome iOS gọi thẳng các
 * đường dẫn này. File được đọc trực tiếp từ ổ bền vững của stu-web; không gọi
 * API và không proxy tới object storage.
 */
export function siteIconResponse(kind: "favicon" | "apple", request: Request) {
  return localSiteIconResponse(
    kind === "favicon"
      ? LOCAL_SITE_ICON_FILES.faviconIco
      : LOCAL_SITE_ICON_FILES.appleTouchIcon,
    request,
  );
}
