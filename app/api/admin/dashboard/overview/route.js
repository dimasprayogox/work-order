// app/(main)/api/admin/dashboard/overview/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

// Note: Add this to your API_ENDPOINTS in api/api.js:
// ADMIN_DASHBOARD_OVERVIEW: `${API_URL}/admin/dashboard/overview`,

export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.ADMIN_DASHBOARD_OVERVIEW, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DASHBOARD OVERVIEW PROXY]", err);
        return NextResponse.json({ message: "Gagal mengambil data dashboard admin." }, { status: 500 });
    }
};
