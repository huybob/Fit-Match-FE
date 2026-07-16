import { NextRequest, NextResponse } from "next/server";

/**
 * F-5 (audit 2026-07-17): trước đây KHÔNG có middleware — bảo vệ route 100% client-side
 * (HTML trang admin vẫn được serve, redirect có flicker, JS lỗi là hở).
 *
 * Giới hạn: token thật nằm ở localStorage (middleware không đọc được) nên chỉ kiểm tra
 * cờ phiên `fitmatch.session` (cookie không chứa token, set/clear cùng tokenStorage).
 * Phân quyền theo ROLE vẫn do AuthGuard (client) + @PreAuthorize (BE) đảm nhận;
 * nâng cấp đầy đủ (refresh token httpOnly cookie) thuộc Phase 5.
 */

const PROTECTED_PREFIXES = ["/admin", "/gym", "/trainer", "/profile", "/notifications", "/change-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );
  if (!isProtected) return NextResponse.next();

  const hasSession = request.cookies.get("fitmatch.session")?.value === "1";
  if (hasSession) return NextResponse.next();

  // F-8: giữ ngữ cảnh trang định vào để login xong quay lại.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnUrl", pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/gym/:path*",
    "/trainer/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/change-password/:path*",
    "/admin",
    "/gym",
    "/trainer",
    "/profile",
    "/notifications",
    "/change-password",
  ],
};
