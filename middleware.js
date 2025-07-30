import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = ["/auth/login", "/auth/register", "/access-denied", "/api/auth/login", "/api/auth/logout", "/api/auth/refresh"];

    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    if (isPublicPath) {
        return NextResponse.next();
    }

    if (!authToken) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    try {
        jwtDecode(authToken); 
    } catch (error) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("authToken");
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|auth|access-denied|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$).*)"]
};
