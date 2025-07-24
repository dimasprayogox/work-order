import { Axios } from "../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

// Endpoint backend asli untuk parts
const PARTS_API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/logistics/parts` : "http://localhost:3100/api/logistics/parts";

/**
 * Handler untuk mengambil semua data parts yang tersedia.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.TECHNICIAN_PART_BASE, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN GET PARTS]", err);
        return NextResponse.json({ message: "Gagal mengambil data parts." }, { status: 500 });
    }
};
