
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const POST = async (request) => {
    try {
        const { email, password } = await request.json();
        const response = await Axios.post(API_ENDPOINTS.LOGINUSERS, { email, password });

        const data = response.data;

        const nextResponse = NextResponse.json(data);

        if (data.token) {
            // Set cookie options
            const cookieOptions = {
                name: "authToken",
                value: data.token,
                httpOnly: true,
                path: "/",
                maxAge: 60 * 60 * 24, // 1 day
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
            };
            // Optionally set domain for production (set COOKIE_DOMAIN in .env if needed)
            if (process.env.COOKIE_DOMAIN) {
                cookieOptions.domain = process.env.COOKIE_DOMAIN;
            }
            nextResponse.cookies.set(cookieOptions);
        }

        return nextResponse;
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API LOGIN PROXY]", err);
        return NextResponse.json({ message: "Gagal terhubung ke server backend." }, { status: 500 });
    }
};
