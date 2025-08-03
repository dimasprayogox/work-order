// api/admin/schedules/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil schedule berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.get(API_ENDPOINTS.ADMIN_SCHEDULE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API SCHEDULES GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data schedule." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate schedule berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();

        const response = await Axios.patch(API_ENDPOINTS.ADMIN_SCHEDULE_BY_ID(id), body, {
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
        console.error("[API SCHEDULES PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate schedule." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus schedule berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.delete(API_ENDPOINTS.ADMIN_SCHEDULE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API SCHEDULES DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus schedule." }, { status: 500 });
    }
};
