// api/admin/divisions/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil division berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.DIVISION_BY_ID(params.id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API DIVISIONS GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data divisi." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate division berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.DIVISION_BY_ID(params.id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API DIVISIONS PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate divisi." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus division berdasarkan ID.
 * @param {Request} request
 * @param {Object} params
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(API_ENDPOINTS.DIVISION_BY_ID(params.id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API DIVISIONS DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus divisi." }, { status: 500 });
    }
};