// api/admin/part-requests/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil detail part request berdasarkan ID.
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
        const response = await Axios.get(API_ENDPOINTS.ADMIN_PART_REQUEST_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API PART REQUEST GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil detail part request." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate part request berdasarkan ID.
 * @param {Request} request
 * @param {Object} context
 */
export const PUT = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = params;
        const body = await request.json();
        const response = await Axios.put(API_ENDPOINTS.ADMIN_PART_REQUEST_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API PART REQUEST PUT]", err);
        return NextResponse.json({ message: "Gagal mengupdate part request." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus part request berdasarkan ID.
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
        const response = await Axios.delete(API_ENDPOINTS.ADMIN_PART_REQUEST_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API PART REQUEST DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus part request." }, { status: 500 });
    }
};
