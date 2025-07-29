// api/admin/part-requests/route.js
import { Axios } from "../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const PART_REQUESTS_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/part-requests` :
    "http://localhost:3100/api/admin/part-requests";

/**
 * Handler untuk mengambil semua part requests
 * GET /api/admin/part-requests
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(PART_REQUESTS_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET PART REQUESTS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data part requests."
        }, { status: 500 });
    }
};

/**
 * Handler untuk bulk delete part requests
 * POST /api/admin/part-requests (with delete-many action)
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Check if this is a delete-many request
        if (body.action === 'delete-many') {
            const response = await Axios.post(`${PART_REQUESTS_API_URL}/delete-many`,
                { ids: body.ids },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return NextResponse.json(response.data);
        }

        return NextResponse.json({
            success: false,
            message: "Invalid action"
        }, { status: 400 });

    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN POST PART REQUESTS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal memproses request."
        }, { status: 500 });
    }
};
