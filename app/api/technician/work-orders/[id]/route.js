import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../../api/api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk memperbarui work order teknisi berdasarkan ID.
 * @param {Request} request - Objek request dari Next.js.
 * @param {{ context.params: { id: string } }} context - Parameter dinamis dari URL.
 */
export const PATCH = async (request, context) => {
    const { id } = context.params; // Ambil ID dari URL
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
        return NextResponse.json({ message: "Work Order ID is required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.TECHNICIAN_WORK_ORDER_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN WORK ORDER PATCH]", err);
        return NextResponse.json({ message: "Gagal memperbarui work order." }, { status: 500 });
    }
};
