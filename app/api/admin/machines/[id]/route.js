// api/admin/machines/[id]/route.js
import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil machine berdasarkan ID.
 * @param {Request} request
 * @param {Object} context
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.get(API_ENDPOINTS.MACHINE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINES GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data mesin." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate machine berdasarkan ID.
 * @param {Request} request
 * @param {Object} context
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.MACHINE_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINES PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate mesin." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus machine berdasarkan ID.
 * @param {Request} request
 * @param {Object} context
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.delete(API_ENDPOINTS.MACHINE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MACHINES DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus mesin." }, { status: 500 });
    }
};
