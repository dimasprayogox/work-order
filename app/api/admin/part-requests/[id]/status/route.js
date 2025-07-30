// api/admin/part-requests/[id]/status/route.js
import { Axios } from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengupdate status part request.
 * @param {Request} request
 * @param {Object} context
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.ADMIN_PART_REQUEST_STATUS(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API PART REQUEST STATUS UPDATE]", err);
        return NextResponse.json({ message: "Gagal mengupdate status part request." }, { status: 500 });
    }
};
