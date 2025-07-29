// api/admin/machine-categories/[id]/route.js
import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil machine category berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Berisi parameter id
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.MACHINE_CATEGORY_BY_ID(params.id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINE CATEGORY GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data kategori mesin." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate machine category berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Berisi parameter id
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.MACHINE_CATEGORY_BY_ID(params.id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINE CATEGORY PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate kategori mesin." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus machine category berdasarkan ID.
 * @param {Request} request
 * @param {Object} params - Berisi parameter id
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(API_ENDPOINTS.MACHINE_CATEGORY_BY_ID(params.id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINE CATEGORY DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus kategori mesin." }, { status: 500 });
    }
};
