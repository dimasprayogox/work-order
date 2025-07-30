// api/admin/part-requests/[id]/status/route.js
import { Axios } from "../../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const PART_REQUESTS_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/part-requests` : "http://localhost:3100/api/admin/part-requests";

/**
 * Handler untuk update status part request
 * PATCH /api/admin/part-requests/[id]/status
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.patch(`${PART_REQUESTS_API_URL}/${params.id}/status`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN UPDATE PART REQUEST STATUS]", err);
        return NextResponse.json(
            {
                success: false,
                message: "Gagal mengupdate status part request."
            },
            { status: 500 }
        );
    }
};
