import { NextResponse } from "next/server";

export const POST = async () => {
    try {
        const isProd = process.env.NODE_ENV === "production";
        // You may want to set domain dynamically if needed
        let cookieOptions = {
            httpOnly: true,
            expires: new Date(0),
            path: "/",
            secure: isProd,
            sameSite: isProd ? "none" : "lax"
        };
        // Optionally set domain for public IP (uncomment and set if needed)
        // cookieOptions.domain = process.env.NEXT_PUBLIC_FRONTEND_URL ? new URL(process.env.NEXT_PUBLIC_FRONTEND_URL).hostname : undefined;

        const response = NextResponse.json(
            {
                success: true,
                message: "Logout successful"
            },
            { status: 200 }
        );
        response.cookies.set("authToken", "", cookieOptions);
        return response;
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: "Logout failed"
            },
            { status: 500 }
        );
    }
};
