// api/admin/machines/route.js
import { Axios } from "../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil semua machines.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.MACHINES, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINES GET ALL]", err);
        return NextResponse.json({ message: "Gagal mengambil data mesin." }, { status: 500 });
    }
};

/**
 * Handler untuk membuat machine baru.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.post(API_ENDPOINTS.MACHINES, body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINES POST]", err);
        return NextResponse.json({ message: "Gagal membuat mesin." }, { status: 500 });
    }
};
