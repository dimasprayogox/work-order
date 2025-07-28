// api/admin/machines/route.js
import { Axios } from "../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const MACHINES_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machines` :
    "http://localhost:3100/api/admin/machines";

/**
 * Handler untuk mengambil semua data machines.
 * GET /api/admin/machines
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(MACHINES_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET MACHINES]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk membuat machine baru.
 * POST /api/admin/machines
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(MACHINES_API_URL, body, {
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
        console.error("[API ADMIN POST MACHINE]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal membuat mesin baru."
        }, { status: 500 });
    }
};
