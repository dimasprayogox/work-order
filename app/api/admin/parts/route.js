// api/admin/parts/route.js
import { Axios } from "../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const ADMIN_PARTS_API_URL = process.env.NEXT_PUBLIC_API_URL ? 
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/parts` : 
    "http://localhost:3100/api/admin/parts";

/**
 * Handler untuk mengambil semua data parts (admin).
 * GET /api/admin/parts
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(ADMIN_PARTS_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET PARTS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data parts."
        }, { status: 500 });
    }
};

/**
 * Handler untuk membuat part baru (admin).
 * POST /api/admin/parts
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(ADMIN_PARTS_API_URL, body, {
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
        console.error("[API ADMIN POST PARTS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal membuat part baru."
        }, { status: 500 });
    }
};