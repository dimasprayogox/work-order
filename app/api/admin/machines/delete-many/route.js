// api/admin/machines/delete-many/route.js
import { Axios } from "../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const MACHINES_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machines` :
    "http://localhost:3100/api/admin/machines";

/**
 * Handler untuk menghapus banyak machines sekaligus.
 * POST /api/admin/machines/delete-many
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(`${MACHINES_API_URL}/delete-many`, body, {
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
        console.error("[API ADMIN DELETE MANY MACHINES]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus mesin yang dipilih."
        }, { status: 500 });
    }
};
