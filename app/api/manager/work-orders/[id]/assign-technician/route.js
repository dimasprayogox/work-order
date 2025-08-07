import { Axios } from "../../../../../utils/axios";
import { API_ENDPOINTS } from "../../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const PATCH = async (request, { params }) => {
    const id = params.id;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
        return NextResponse.json({ message: "Work Order ID is required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        console.log(`[Proxy] Meneruskan PATCH ke API: ${API_ENDPOINTS.MANAGER_ASSIGN_TECHNICIAN(id)}`);
        console.log("[Proxy] Data yang dikirim:", body);

        const response = await Axios.patch(API_ENDPOINTS.MANAGER_ASSIGN_TECHNICIAN(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("[Proxy] Respons dari API:", response.data);
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            console.error(`[Proxy] API eksternal mengembalikan error ${err.response.status}:`, err.response.data);
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error(`[Proxy] Terjadi error tak terduga:`, err);
        return NextResponse.json({ message: "Gagal menugaskan teknisi." }, { status: 500 });
    }
};