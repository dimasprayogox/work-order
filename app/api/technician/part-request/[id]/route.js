import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil detail part request berdasarkan ID.
 * @param {Request} request
 * @param {{ context.params: { id: string } }} context
 */
export const GET = async (request, context) => {
    // FIX: Nama parameter harus 'id' sesuai dengan nama folder '[id]'
    const { id } = context.params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // FIX: Gunakan 'id' yang didapat dari context.params
        const response = await Axios.get(API_ENDPOINTS.TECHNICIAN_PART_REQUEST_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN PART REQUEST GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil detail part request." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus part request berdasarkan ID.
 * @param {Request} request
 * @param {{ context.params: { id: string } }} context
 */
export const DELETE = async (request, context) => {
    const { id } = context.params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await Axios.delete(API_ENDPOINTS.TECHNICIAN_PART_REQUEST_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Berhasil dihapus, kembalikan status 204 No Content
        return new NextResponse(null, { status: 204 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN PART REQUEST DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus part request." }, { status: 500 });
    }
};
