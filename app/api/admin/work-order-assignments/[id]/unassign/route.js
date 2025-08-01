import { Axios } from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Unassign work order from technician
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();

        const response = await Axios.patch(API_ENDPOINTS.ADMIN_WORK_ORDER_UNASSIGN(id), body, {
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
        console.error("[API WORK ORDER UNASSIGN PATCH]", err);
        return NextResponse.json({ message: "Gagal melakukan unassign work order." }, { status: 500 });
    }
};
