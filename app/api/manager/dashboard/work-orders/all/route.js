import { Axios } from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const response = await Axios.get(API_ENDPOINTS.MANAGER_WORK_ORDERS, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MANAGER ALL WORK ORDERS PROXY]", err);
        return NextResponse.json({ message: "Gagal mengambil semua work order manajer." }, { status: 500 });
    }
};
