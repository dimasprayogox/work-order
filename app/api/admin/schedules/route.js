// api/admin/schedules/route.js
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil semua schedules.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.ADMIN_SCHEDULES, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API SCHEDULES GET ALL]", err);
        return NextResponse.json({ message: "Gagal mengambil data schedule." }, { status: 500 });
    }
};

/**
 * Handler untuk membuat schedule baru.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.post(API_ENDPOINTS.ADMIN_SCHEDULES, body, {
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
        console.error("[API SCHEDULES POST]", err);
        return NextResponse.json({ message: "Gagal membuat schedule." }, { status: 500 });
    }
};
