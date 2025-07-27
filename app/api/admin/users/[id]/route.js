import { Axios } from "../../../../../utils/axios";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

const USERS_API_URL = process.env.NEXT_PUBLIC_API_URL ?
    `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users` :
    "http://localhost:3100/api/admin/users";

/**
 * Handler untuk mengambil data user berdasarkan ID.
 * GET /api/admin/users/[id]
 */
export const GET = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(`${USERS_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN GET USER BY ID]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengambil data user."
        }, { status: 500 });
    }
};

/**
 * Handler untuk update user berdasarkan ID.
 * PATCH /api/admin/users/[id]
 */
export const PATCH = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const response = await Axios.patch(`${USERS_API_URL}/${params.id}`, body, {
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
        console.error("[API ADMIN PATCH USER]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal mengupdate user."
        }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus user berdasarkan ID.
 * DELETE /api/admin/users/[id]
 */
export const DELETE = async (request, { params }) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.delete(`${USERS_API_URL}/${params.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ADMIN DELETE USER]", err);
        return NextResponse.json({
            success: false,
            message: "Gagal menghapus user."
        }, { status: 500 });
    }
};
