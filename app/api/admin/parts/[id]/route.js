// api/admin/parts/[id]/route.js
import { Axios } from "../../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const ADMIN_PARTS_API_URL = process.env.NEXT_PUBLIC_API_URL ? 
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/parts` : 
    "http://localhost:3100/api/admin/parts";

/**
 * Handler untuk mengambil data part berdasarkan ID (admin).
 * GET /api/admin/parts/[id]
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(`${ADMIN_PARTS_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET PART BY ID]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data part."
        }, { status: 500 });
    }
};

/**
 * Handler untuk update part berdasarkan ID (admin).
 * PATCH /api/admin/parts/[id]
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.patch(`${ADMIN_PARTS_API_URL}/${params.id}`, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN PATCH PART]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengupdate part."
        }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus part berdasarkan ID (admin).
 * DELETE /api/admin/parts/[id]
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(`${ADMIN_PARTS_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DELETE PART]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus part."
        }, { status: 500 });
    }
};