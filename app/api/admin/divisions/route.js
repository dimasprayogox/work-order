// api/admin/divisions/route.js
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil semua divisions.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.DIVISIONS, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API DIVISIONS GET ALL]", err);
        return NextResponse.json({ message: "Gagal mengambil data divisi." }, { status: 500 });
    }
};

/**
 * Handler untuk membuat division baru.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.post(API_ENDPOINTS.DIVISIONS, body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API DIVISIONS POST]", err);
        return NextResponse.json({ message: "Gagal membuat divisi." }, { status: 500 });
    }
};