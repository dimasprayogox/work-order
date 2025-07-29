import { Axios } from "../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const USERS_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users` :
    "http://localhost:3100/api/admin/users";

/**
 * Handler untuk mengambil semua data users.
 * GET /api/admin/users
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(USERS_API_URL, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET USERS]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data users."
        }, { status: 500 });
    }
};

/**
 * Handler untuk membuat user baru.
 * POST /api/admin/users
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

        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN POST USER]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal membuat user baru."
        }, { status: 500 });
    }
};
