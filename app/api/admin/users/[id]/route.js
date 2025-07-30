// api/admin/users/[id]/route.js
import { Axios } from "../../../../utils/axios"; // Sesuaikan path jika perlu
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil user berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.get(API_ENDPOINTS.USER_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API USER GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data user." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate user berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.USER_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API USER PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate user." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus user berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const response = await Axios.delete(API_ENDPOINTS.USER_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API USER DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus user." }, { status: 500 });
    }
};
