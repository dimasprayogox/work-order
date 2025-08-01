import { NextResponse } from "next/server";
import { Axios } from "../../utils/axios";
import { API_ENDPOINTS } from "../api";
import { isAxiosError } from "axios";

export const GET = async (request) => {
    try {
        const token = request.cookies.get("authToken")?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: "Unauthorized", data: null }, { status: 401 });
        }

        const response = await Axios.get(API_ENDPOINTS.GET_DETAIL_PROFILE, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[PROFILE_API_ERROR]:", err);
        return NextResponse.json({ success: false, message: "Gagal mengambil data profil" }, { status: 500 });
    }
};

export const PATCH = async (request) => {
    try {
        const token = request.cookies.get("authToken")?.value;
        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Unauthorized"
                },
                { status: 401 }
            );
        }

        // Ambil FormData langsung dari request
        const formData = await request.formData();

        // Kirim ke API backend
        const response = await Axios.patch(API_ENDPOINTS.GET_DETAIL_PROFILE, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data"
            }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        console.error("[PROFILE_UPDATE_ERROR]:", err);
        if (isAxiosError(err) && err.response) {
            const errorData = err.response.data;
            return NextResponse.json(
                {
                    success: false,
                    message: errorData?.message || "Gagal update profile",
                    errors: errorData?.errors || {}
                },
                { status: err.response.status }
            );
        }
        return NextResponse.json(
            {
                success: false,
                message: "Terjadi kesalahan server"
            },
            { status: 500 }
        );
    }
};