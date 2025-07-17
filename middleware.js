import { NextResponse } from "next/server";

export function middleware(request) {
    const isLoggedIn = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const protectedPaths = ["/", "/master", "/monitor"];
    const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/master/:path*", "/monitor/:path*"]
};
