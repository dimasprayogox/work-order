// api/admin/issues/route.js
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil semua issues.
 * @param {Request} request
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.ADMIN_ISSUES, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ISSUES GET ALL]", err);
        return NextResponse.json({ message: "Gagal mengambil data issue." }, { status: 500 });
    }
};

/**
 * Handler untuk membuat issue baru.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        // Create FormData for backend
        const backendFormData = new FormData();

        // Append text fields
        const title = formData.get('title');
        const description = formData.get('description');
        const machine_id = formData.get('machine_id');
        const reported_by_id = formData.get('reported_by_id');

        if (title) backendFormData.append('title', title);
        if (description) backendFormData.append('description', description);
        if (machine_id) backendFormData.append('machine_id', machine_id);
        if (reported_by_id) backendFormData.append('reported_by_id', reported_by_id);

        // Append photo if exists
        const photo = formData.get('photo');
        if (photo && photo.size > 0) {
            backendFormData.append('photo', photo);
        }

        const response = await Axios.post(API_ENDPOINTS.ADMIN_ISSUES, backendFormData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return NextResponse.json(response.data, { status: 201 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ISSUES POST]", err);
        return NextResponse.json({ message: "Gagal membuat issue." }, { status: 500 });
    }
};
