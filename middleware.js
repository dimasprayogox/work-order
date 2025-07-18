import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const allowedRolesForPaths = {
        "/dashboard/admin": ["admin"],
        "/dashboard/employee": ["employee"],
        "/dashboard/technician": ["technician"],
        "/dashboard/manager": ["manager"],
        "/dashboard/logistics": ["logistics"],
        "/master": ["admin", "manager"],
        "/monitor": ["admin", "technician", "manager"],
    };

    if (!authToken) {
        
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/master') || pathname.startsWith('/monitor')) {
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next();
    }

    let userRole = null;
    try {
        
        const decodedToken = jwtDecode(authToken);
        userRole = decodedToken.role;
    } catch (error) {
        console.error("Gagal mendekode token atau token tidak valid:", error);
        
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (pathname === '/dashboard' || pathname === '/dashboard/') {
        
        const redirectPath = `/dashboard/${userRole}`;
        console.log(`Mengarahkan pengguna '${userRole}' dari /dashboard ke ${redirectPath}`);
        return NextResponse.redirect(new URL(redirectPath, request.url));
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

    if (isRoleSpecificRoute) {
        if (!allowedRoles.includes(userRole)) {
            console.warn(`Akses ditolak: Pengguna dengan peran '${userRole}' mencoba mengakses '${pathname}'`);
            
            return NextResponse.redirect(new URL("/access-denied", request.url));
            
        }
    }

    return NextResponse.next();
}

export const config = {
    
    matcher: [
        "/dashboard/:path*",
        "/master/:path*",
        "/monitor/:path*",
    ],
};