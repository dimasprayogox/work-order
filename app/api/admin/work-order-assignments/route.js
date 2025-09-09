// api/admin/work-order-assignments/route.js
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Get all work orders with assignment status
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        const response = await Axios.get(
            `${API_ENDPOINTS.ADMIN_WORK_ORDER_ASSIGNMENTS}${queryString ? `?${queryString}` : ''}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API WORK ORDER ASSIGNMENTS GET]", err);
        return NextResponse.json({ message: "Gagal mengambil data work order assignments." }, { status: 500 });
    }
};

export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();

        // Handle delete many request
        if (body.ids && Array.isArray(body.ids)) {
            const response = await Axios.post(API_ENDPOINTS.ADMIN_WORK_ORDER_DELETE_MANY, body, { headers: { Authorization: `Bearer ${token}` } });
            return NextResponse.json(response.data, { status: 200 });
        }

    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN WORK ORDERS POST PROXY]", err);
        return NextResponse.json({ message: "Gagal membuat work order." }, { status: 500 });
    }
};
