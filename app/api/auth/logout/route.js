import { NextResponse } from "next/server";

export const POST = async () => {
    try {
        const response = NextResponse.json(
            {
                success: true,
                message: "Logout successful"
            },
            { status: 200 }
        );

        // Clear cookie dengan setting yang konsisten
        response.cookies.set("authToken", "", {
            httpOnly: false, // Konsisten dengan login
            expires: new Date(0),
            path: "/",
            secure: false, // Set false untuk HTTP, true untuk HTTPS
            sameSite: "lax"
        });

        return response;
    } catch (error) {
        console.error("[API LOGOUT]", error);
        return NextResponse.json(
            {
                success: false,
                message: "Logout failed"
            },
            { status: 500 }
        );
    }
};
