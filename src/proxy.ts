import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerConfig } from "@/config/server";
import { toPublicUrl } from "@/lib/trusted-browser-request";
import {
  getLoginUrl,
  getRefreshSessionUrl,
} from "@/lib/auth/callback-url";

const accessCookieName =
  getServerConfig().accessCookieName;
const refreshCookieName =
  getServerConfig().refreshCookieName;
const publicOrigin = getServerConfig().webUrl;

export function proxy(request: NextRequest) {
  const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  const headers = new Headers(request.headers);
  headers.set("x-stu-request-url", callbackUrl);

  if (!isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.next({ request: { headers } });
  }

  if (request.cookies.get(accessCookieName)?.value) {
    return NextResponse.next({ request: { headers } });
  }

  if (request.cookies.get(refreshCookieName)?.value) {
    return NextResponse.redirect(
      toPublicUrl(getRefreshSessionUrl(callbackUrl, "required"), publicOrigin),
    );
  }

  return NextResponse.redirect(toPublicUrl(getLoginUrl(callbackUrl), publicOrigin));
}

function isProtectedPath(pathname: string) {
  return (
    pathname === "/member" ||
    pathname.startsWith("/member/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

export const config = {
  // Public Server Components cũng cần URL hiện tại để refresh xong quay lại đúng
  // dynamic path và query. API/static assets và icon cố định không tham gia
  // auth resolution này.
  matcher: [
    "/((?!api|media/|site-icons/|_next/static|_next/image|favicon.ico|apple-touch-icon.png|apple-touch-icon-precomposed.png).*)",
  ],
};
