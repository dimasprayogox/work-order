// api/admin/parts/[id]/route.js
import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil part berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Contains the dynamic route parameters
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.get(API_ENDPOINTS.ADMIN_PARTS_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN PARTS GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data part." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate part berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Contains the dynamic route parameters
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.ADMIN_PARTS_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN PARTS PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate part." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus part berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Contains the dynamic route parameters
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.delete(API_ENDPOINTS.ADMIN_PARTS_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN PARTS DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus part." }, { status: 500 });
    }
};
