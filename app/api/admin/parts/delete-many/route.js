// api/admin/parts/delete-many/route.js
import { Axios } from "../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const ADMIN_PARTS_DELETE_MANY_API_URL = process.env.NEXT_PUBLIC_API_URL ? 
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/parts/delete-many` : 
    "http://localhost:3100/api/admin/parts/delete-many";

/**
 * Handler untuk menghapus multiple parts (admin).
 * POST /api/admin/parts/delete-many
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
                message: "Invalid input: 'ids' must be a non-empty array of part IDs."
            }, { status: 400 });
        }

        const response = await Axios.post(ADMIN_PARTS_DELETE_MANY_API_URL, body, {
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
        console.error("[API ADMIN DELETE MANY PARTS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus parts."
        }, { status: 500 });
    }
};