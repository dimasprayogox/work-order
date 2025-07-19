import { NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

export function middleware(request) {
    const authToken = request.cookies.get("authToken")?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = [
        '/auth/login',
        '/auth/register',
        '/access-denied',
        
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
        "/profile": ["admin", "employee", "technician", "manager", "logistics"]
    };

    if (!authToken) {
        
        if (!isPublicPath) {
            console.log(`No authToken, redirecting '${pathname}' to /auth/login`);
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
        return NextResponse.next();
    }

    let userRole = null;
    try {
        const decodedToken = jwtDecode(authToken);
        userRole = decodedToken.role;
    } catch (error) {
        console.error("Failed to decode token or invalid token:", error);
        
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    if (pathname === '/' || pathname === '/index' || pathname === '/dashboard' || pathname === '/dashboard/') {
        const redirectPath = roleDashboards[userRole];
        if (redirectPath) {
            console.log(`Redirecting user role '${userRole}' to ${redirectPath}`);
            return NextResponse.redirect(new URL(redirectPath, request.url));
        } else {
            console.warn(`Unknown user role '${userRole}', redirecting to default dashboard or login.`);
            return NextResponse.redirect(new URL("/auth/login", request.url));
        }
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
            console.warn(`Access denied: User with role '${userRole}' tried to access '${pathname}'`);
            return NextResponse.redirect(new URL("/access-denied", request.url));
        }
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/", 
        "/index",
        "/dashboard/:path*",
        "/master/:path*",
        "/monitor/:path*",
        "/profile/:path*",
        "/maintenance/:path*",
        "/assets/:path*",
        "/supplies/:path*",
        "/analytics/:path*",
        "/users/:path*",
    ],
};