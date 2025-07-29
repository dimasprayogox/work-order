// api/admin/part-requests/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const PART_REQUESTS_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/part-requests` :
    "http://localhost:3100/api/admin/part-requests";

/**
 * Handler untuk menghapus part request berdasarkan ID
 * DELETE /api/admin/part-requests/[id]
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(`${PART_REQUESTS_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DELETE PART REQUEST]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus part request."
        }, { status: 500 });
    }
};
