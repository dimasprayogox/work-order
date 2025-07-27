import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

// Endpoint backend asli untuk machine categories by ID
const MACHINE_CATEGORIES_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machine-categories` : "http://localhost:3100/api/admin/machine-categories";

/**
 * Handler untuk mengambil data machine category berdasarkan ID.
 * GET /api/admin/machine-categories/[id]
 * @param {Request} request
 * @param {Object} params
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(`${MACHINE_CATEGORIES_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET MACHINE CATEGORY BY ID]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data kategori mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk update machine category berdasarkan ID.
 * PUT /api/admin/machine-categories/[id]
 * @param {Request} request
 * @param {Object} params
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.put(`${MACHINE_CATEGORIES_API_URL}/${params.id}`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN PUT MACHINE CATEGORY]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengupdate kategori mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus machine category berdasarkan ID.
 * DELETE /api/admin/machine-categories/[id]
 * @param {Request} request
 * @param {Object} params
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(`${MACHINE_CATEGORIES_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DELETE MACHINE CATEGORY]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus kategori mesin."
        }, { status: 500 });
    }
};
