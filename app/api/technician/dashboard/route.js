import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // Panggil kedua endpoint secara bersamaan (paralel)
        const [overviewResponse, overdueResponse] = await Promise.all([Axios.get(API_ENDPOINTS.GET_TECHNICIAN_DASHBOARD_OVERVIEW, authHeader), Axios.get(API_ENDPOINTS.GET_TECHNICIAN_OVERDUE_WORK_ORDERS, authHeader)]);

        // Gabungkan hasilnya menjadi satu objek
        const responseData = {
            overview: overviewResponse.data,
            overdueWorkOrders: overdueResponse.data
        };

        return NextResponse.json(responseData);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN DASHBOARD PROXY]", err);
        return NextResponse.json({ message: "Gagal mengambil data dashboard teknisi." }, { status: 500 });
    }
};
