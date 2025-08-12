import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = ["/auth/login", "/auth/register", "/access-denied", "/api/auth/login", "/api/auth/logout", "/api/auth/refresh"];

    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

    const roleDashboards = {
        admin: "/admin/dashboard",
        employee: "/employee/dashboard",
        technician: "/technician/dashboard",
        manager: "/manager/dashboard",
        logistics: "/logistics/dashboard"
    };

    const allowedRolesForPaths = {
        "/admin": ["admin"],
        "/employee": ["employee"],
        "/technician": ["technician"],
        "/manager": ["manager"],
        "/logistics": ["logistics"],
        "/master": ["admin", "manager"],
        "/monitor": ["admin", "technician", "manager"],
        "/profile": ["admin", "employee", "technician", "manager", "logistics"]
    };

    // Allow public paths
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Check if token exists
    if (!authToken) {
        const loginUrl = new URL("/auth/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    let userRole = null;
    try {
        const decodedToken = jwtDecode(authToken);
        
        // Check if token is expired
        if (decodedToken.exp && decodedToken.exp < Date.now() / 1000) {
            const response = NextResponse.redirect(new URL("/auth/login", request.url));
            response.cookies.delete("authToken");
            return response;
        }
        
        userRole = decodedToken.role;
    } catch (error) {
        console.error("JWT decode error:", error);
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete("authToken");
        return response;
    }

    // Redirect root paths to role-specific dashboard
    if (pathname === "/" || pathname === "/index" || pathname === "/dashboard" || pathname === "/dashboard/") {
        const redirectPath = roleDashboards[userRole];
        if (redirectPath) {
            return NextResponse.redirect(new URL(redirectPath, request.url));
        }
        return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    // Check role-based access
    let isAuthorized = false;
    for (const pathPrefix in allowedRolesForPaths) {
        if (pathname.startsWith(pathPrefix)) {
            const allowedRoles = allowedRolesForPaths[pathPrefix];
            if (allowedRoles.includes(userRole)) {
                isAuthorized = true;
                break;
            }
        }
    }

    // If path requires specific role but user doesn't have it
    if (Object.keys(allowedRolesForPaths).some(path => pathname.startsWith(path)) && !isAuthorized) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|auth|access-denied|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$).*)"]
};
