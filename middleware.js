// middleware.js

import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    console.log(`[Middleware Check] Pathname: ${pathname}`);
    console.log(`[Middleware Check] AuthToken Exists: ${!!authToken}`);

    const publicPaths = [
        '/auth/login',
        '/auth/register',
        '/access-denied',
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/refresh',
    ];

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
    console.log(`[Middleware Check] Is Public Path: ${isPublicPath}`);

    const roleDashboards = {
        "admin": "/dashboard/admin",
        "employee": "/dashboard/employee",
        "technician": "/dashboard/technician",
        "manager": "/dashboard/manager",
        "logistics": "/dashboard/logistics",
    };

    const allowedRolesForPaths = {
        "/dashboard/admin": ["admin"],
        "/dashboard/employee": ["employee"],
        "/dashboard/technician": ["technician"],
        "/dashboard/manager": ["manager"],
        "/dashboard/logistics": ["logistics"],
        "/master": ["admin", "manager"],
        "/monitor": ["admin", "technician", "manager"],
        "/profile": ["admin", "employee", "technician", "manager", "logistics"],
        "/api/admin/users": ["admin"],
        "/api/admin/machine-categories": ["admin"],
        "/api/admin/machines": ["admin"],
        "/api/employee/dashboard/my-overview": ["employee"],
        "/api/employee/issues": ["employee"],
        "/api/employee/machines/available": ["employee"],
        "/api/employee/work-orders/my-requests": ["employee"],
        "/api/technician/dashboard": ["technician"],
        "/api/technician/work-orders": ["technician"],
        "/api/technician/work-orders/my-requests": ["technician"],
        "/api/technician/work-orders/:id/update-status": ["technician"],
        "/api/manager/dashboard": ["manager"],
        "/api/manager/work-orders": ["manager"],
        "/api/manager/schedules": ["manager"],
        "/api/user-detail": ["admin", "employee", "technician", "manager", "logistics"],
    };


    // 1. Jika jalur yang diakses adalah public path, langsung izinkan.
    if (isPublicPath) {
        console.log(`[Middleware Decision] Public Path. Allowing access to: ${pathname}`);
        return NextResponse.next();
    }

    // 2. Jika bukan public path DAN tidak ada authToken, redirect ke halaman login.
    if (!authToken) {
        console.log(`[Middleware Decision] No AuthToken & Not Public. Redirecting to /auth/login.`);
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // 3. Jika ada token, coba decode untuk mendapatkan peran pengguna.
    let userRole = null;
    try {
        const decodedToken = jwtDecode(authToken);
        userRole = decodedToken.role;
        console.log(`[Middleware Check] Decoded User Role: ${userRole}`);
    } catch (error) {
        console.error("Middleware Error: Gagal mendekode token atau token tidak valid:", error);
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete('authToken');
        return response;
    }

    // 4. Penanganan pengalihan dashboard berdasarkan peran (setelah login)
    if (pathname === '/' || pathname === '/index' || pathname === '/dashboard' || pathname === '/dashboard/') {
        const redirectPath = roleDashboards[userRole];
        if (redirectPath) {
            console.log(`[Middleware Decision] Redirecting to role dashboard: ${redirectPath}`);
            return NextResponse.redirect(new URL(redirectPath, request.url));
        } else {
            console.warn(`[Middleware Decision] Unknown role dashboard for: ${userRole}. Redirecting to /access-denied.`);
            return NextResponse.redirect(new URL("/access-denied", request.url));
        }
    }

    // 5. Penanganan otorisasi berbasis peran untuk rute lainnya
    let isRoleSpecificRoute = false;
    let allowedRoles = [];

    for (const pathPrefix in allowedRolesForPaths) {
        if (pathname.startsWith(pathPrefix)) {
            isRoleSpecificRoute = true;
            allowedRoles = allowedRolesForPaths[pathPrefix];
            console.log(`[Middleware Check] Path '${pathname}' cocok dengan prefix '${pathPrefix}'. Peran yang diizinkan: ${allowedRoles.join(', ')}.`);
            break;
        }
    }

    if (isRoleSpecificRoute) {
        if (!allowedRoles.includes(userRole)) {
            console.warn(`[Middleware Decision] ACCESS DENIED: Role '${userRole}' not allowed for '${pathname}'. Allowed: ${allowedRoles.join(', ')}`);
            return NextResponse.redirect(new URL("/access-denied", request.url));
        }
        console.log(`[Middleware Decision] ACCESS GRANTED: Role '${userRole}' allowed for '${pathname}'.`);
    } else {
        console.log(`[Middleware Decision] No specific role rule for '${pathname}'. Allowing by default.`);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
      '/((?!api|auth|access-denied|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$|.*\\.svg$|.*\\.css$|.*\\.js$|.*\\.woff$|.*\\.woff2$|.*\\.ttf$|.*\\.eot$).*)',
    ],
};
