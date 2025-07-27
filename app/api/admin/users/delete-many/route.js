import { Axios } from "../../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const USERS_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/delete-many` :
    "http://localhost:3100/api/admin/users/delete-many";

/**
 * Handler untuk menghapus multiple users sekaligus.
 * POST /api/admin/users/delete-many
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(USERS_API_URL, body, {
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
        console.error("[API ADMIN DELETE MANY USERS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus users."
        }, { status: 500 });
    }
};
