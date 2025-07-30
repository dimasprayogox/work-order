// api/admin/machine-categories/delete-many/route.js
import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk menghapus banyak machine categories sekaligus.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json(); // { ids: [...] }
        const response = await Axios.post(API_ENDPOINTS.DELETE_MANY_MACHINE_CATEGORIES, body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINE CATEGORIES DELETE MANY]", err);
        return NextResponse.json({ message: "Gagal menghapus kategori mesin." }, { status: 500 });
    }
};
