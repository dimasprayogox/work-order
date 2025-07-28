import { Axios } from "../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

// Endpoint backend asli untuk machine categories
const MACHINE_CATEGORIES_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machine-categories` : "http://localhost:3100/api/admin/machine-categories";

/**
 * Handler untuk mengambil semua data machine categories.
 * GET /api/admin/machine-categories
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(MACHINE_CATEGORIES_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET MACHINE CATEGORIES]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data kategori mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk membuat machine category baru.
 * POST /api/admin/machine-categories
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(MACHINE_CATEGORIES_API_URL, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN POST MACHINE CATEGORIES]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal membuat kategori mesin."
        }, { status: 500 });
    }
};
