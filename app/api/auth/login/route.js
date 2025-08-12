
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
            // Cookie settings yang lebih robust untuk production
            const cookieOptions = {
                name: "authToken",
                value: data.token,
                httpOnly: false, // Perlu false agar bisa diakses client-side
                path: "/",
                maxAge: 60 * 60 * 24, // 24 jam
                secure: false, // Set false untuk HTTP, true untuk HTTPS
                sameSite: "lax"
            };

            // Untuk production dengan HTTPS, aktifkan secure
            if (process.env.NODE_ENV === "production" && request.url.startsWith('https')) {
                cookieOptions.secure = true;
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
