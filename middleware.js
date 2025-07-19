// middleware.js

import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = [
        '/auth/login',
        '/auth/register',
        '/access-denied',
        '/api/auth',
    ];

    const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

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
        "/api/technician/dashboard": ["technician"],
        "/api/technician/work-orders": ["technician"],
        "/api/manager/dashboard": ["manager"],
        "/api/manager/work-orders": ["manager"],
        "/api/manager/schedules": ["manager"],
        "/api/user-detail": ["admin", "employee", "technician", "manager", "logistics"],
        
        "/api/employee/machines/available": ["employee"], 
    };

    if (isPublicPath) {
        return NextResponse.next();
    }

    if (!authToken) {
        console.log(`Middleware: Tidak ada authToken. Mengalihkan '${pathname}' ke /auth/login.`);
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    let userRole = null;
    try {
        const decodedToken = jwtDecode(authToken);
        userRole = decodedToken.role;
        console.log(`Middleware: Token berhasil didekode. Peran pengguna: ${userRole}`);
    } catch (error) {
        console.error("Middleware Error: Gagal mendekode token atau token tidak valid:", error);
        const response = NextResponse.redirect(new URL("/auth/login", request.url));
        response.cookies.delete('authToken'); 
        return response;
    }

    if (pathname === '/' || pathname === '/index' || pathname === '/dashboard' || pathname === '/dashboard/') {
        const redirectPath = roleDashboards[userRole];
        if (redirectPath) {
            console.log(`Middleware: Mengalihkan peran pengguna '${userRole}' dari '${pathname}' ke ${redirectPath}.`);
            return NextResponse.redirect(new URL(redirectPath, request.url));
        } else {
            console.warn(`Middleware: Peran pengguna tidak dikenal '${userRole}'. Mengalihkan ke /access-denied.`);
            return NextResponse.redirect(new URL("/access-denied", request.url));
        }
    }

    let isRoleSpecificRoute = false;
    let allowedRoles = [];

    for (const pathPrefix in allowedRolesForPaths) {
        if (pathname.startsWith(pathPrefix)) { 
            isRoleSpecificRoute = true;
            allowedRoles = allowedRolesForPaths[pathPrefix];
            console.log(`Middleware: Path '${pathname}' cocok dengan prefix '${pathPrefix}'. Peran yang diizinkan: ${allowedRoles.join(', ')}.`);
            break;
        }
    }

    if (isRoleSpecificRoute) {
        if (!allowedRoles.includes(userRole)) {
            console.warn(`Middleware: Akses ditolak. Pengguna dengan peran '${userRole}' mencoba mengakses '${pathname}'.`);
            return NextResponse.redirect(new URL("/access-denied", request.url));
        }
        console.log(`Middleware: Akses diizinkan untuk peran '${userRole}' ke '${pathname}'.`);
    } else {
        console.log(`Middleware: Tidak ada aturan peran spesifik untuk '${pathname}'. Mengizinkan akses.`);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api/auth|auth/login|auth/register|access-denied|_next/static|_next/image|favicon.ico).*)',
    ],
};