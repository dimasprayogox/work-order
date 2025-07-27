// api/admin/machines/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const MACHINES_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/machines` :
    "http://localhost:3100/api/admin/machines";

/**
 * Handler untuk mengambil data machine berdasarkan ID.
 * GET /api/admin/machines/[id]
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(`${MACHINES_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET MACHINE BY ID]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk update machine berdasarkan ID.
 * PATCH /api/admin/machines/[id]
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.put(`${MACHINES_API_URL}/${params.id}`, body, {
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
        console.error("[API ADMIN PATCH MACHINE]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengupdate mesin."
        }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus machine berdasarkan ID.
 * DELETE /api/admin/machines/[id]
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(`${MACHINES_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DELETE MACHINE]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus mesin."
        }, { status: 500 });
    }
};
