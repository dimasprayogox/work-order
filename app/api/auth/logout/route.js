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

        response.cookies.set("authToken", "", {
            httpOnly: true,
            expires: new Date(0),
            path: "/"
        });

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