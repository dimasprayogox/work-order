import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

// Endpoint backend asli untuk bulk delete machine categories
const MACHINE_CATEGORIES_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machine-categories` : "http://localhost:3100/api/admin/machine-categories";

/**
 * Handler untuk menghapus multiple machine categories sekaligus.
 * POST /api/admin/machine-categories/delete-many
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            return NextResponse.json({
                success: false,
                message: "IDs array is required and cannot be empty"
            }, { status: 400 });
        }

        const response = await Axios.post(`${MACHINE_CATEGORIES_API_URL}/delete-many`, body, {
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
        console.error("[API ADMIN DELETE MANY MACHINE CATEGORIES]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus kategori mesin."
        }, { status: 500 });
    }
};
