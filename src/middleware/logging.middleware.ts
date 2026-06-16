import { NextRequest, NextResponse } from "next/server";

export function loggingMiddleware(request: NextRequest) {
  console.info(`${request.method} ${request.nextUrl.pathname}`);
  return NextResponse.next({
    request,
  });
}
