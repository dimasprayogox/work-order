import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = [
        '/auth/login',
        '/auth/register',
        '/access-denied',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/refresh',
    ];

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

    const roleDashboards = {
        "admin": "/dashboard/admin",
        "employee": "/dashboard/employee",
        "technician": "/technician/dashboard",
        "manager": "/manager/dashboard",
        "logistics": "/logistics/dashboard",
    };

    const allowedRolesForPaths = {
        "/dashboard/admin": ["admin"],
        "/dashboard/employee": ["employee"],
        "/technician/dashboard": ["technician"],
        "/manager/dashboard": ["manager"],
        "/logistics/dashboard": ["logistics"],
        "/master": ["admin", "manager"],
        "/monitor": ["admin", "technician", "manager"],
        "/profile": ["admin", "employee", "technician", "manager", "logistics"],
    };

    if (isPublicPath) {
        return NextResponse.next();
    }

    if (!authToken) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    let userRole = null;
    try {
        const decodedToken = jwtDecode(authToken);
        userRole = decodedToken.role;
    } catch (error) {
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete('authToken');
        return response;
    }

    if (pathname === '/' || pathname === '/index' || pathname === '/dashboard' || pathname === '/dashboard/') {
        const redirectPath = roleDashboards[userRole];
        if (redirectPath) {
            return NextResponse.redirect(new URL(redirectPath, request.url));
        }
        return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    let isRoleSpecificRoute = false;
    let allowedRoles = [];

    for (const pathPrefix in allowedRolesForPaths) {
        if (pathname.startsWith(pathPrefix)) {
            isRoleSpecificRoute = true;
            allowedRoles = allowedRolesForPaths[pathPrefix];
            break;
        }
    }

    if (isRoleSpecificRoute && !allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/access-denied", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|auth|access-denied|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$).*)',
    ],
};