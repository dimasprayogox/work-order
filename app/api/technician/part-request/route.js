import { Axios } from "../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil semua part request milik teknisi.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.TECHNICIAN_PART_REQUEST_BASE, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN PART REQUEST GET ALL]", err);
        return NextResponse.json({ message: "Gagal mengambil data part request." }, { status: 500 });
    }
};

/**
 * Handler untuk membuat part request baru.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.post(API_ENDPOINTS.TECHNICIAN_PART_REQUEST_BASE, body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN PART REQUEST POST]", err);
        return NextResponse.json({ message: "Gagal membuat part request." }, { status: 500 });
    }
};

export const DELETE = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json(); // { ids: [...] }
        const response = await Axios.delete(`${API_ENDPOINTS.TECHNICIAN_PART_REQUEST_BASE}/deletemany`, {
            headers: { Authorization: `Bearer ${token}` },
            data: body
        });
        return NextResponse.json(response.data, { status: 200 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API TECHNICIAN PART REQUEST DELETE MANY]", err);
        return NextResponse.json({ message: "Gagal menghapus part request." }, { status: 500 });
    }
};
