// api/admin/issues/[id]/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk mengambil issue berdasarkan ID.
 * @param {Request} request
 * @param {Object} context
 */
export const GET = async (request, context) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const params = await context.params;
        const { id } = params;
        const response = await Axios.get(API_ENDPOINTS.ADMIN_ISSUE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ISSUES GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil data issue." }, { status: 500 });
    }
};

/**
 * Handler untuk mengupdate issue.
 * @param {Request} request
 * @param {Object} context
 */
export const PATCH = async (request, context) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const params = await context.params;
        const { id } = params;
        const formData = await request.formData();

        // Create FormData for backend
        const backendFormData = new FormData();

        // Append text fields
        const title = formData.get('title');
        const description = formData.get('description');
        const machine_id = formData.get('machine_id');
        const reported_by_id = formData.get('reported_by_id');
        const remove_photo = formData.get('remove_photo');

        if (title) backendFormData.append('title', title);
        if (description) backendFormData.append('description', description);
        if (machine_id) backendFormData.append('machine_id', machine_id);
        if (reported_by_id) backendFormData.append('reported_by_id', reported_by_id);

        // Improved photo handling
        const photo = formData.get('photo');
        if (photo && photo.size > 0) {
            backendFormData.append('photo', photo);
        } else if (remove_photo === 'true') {
            backendFormData.append('remove_photo', remove_photo);
        }

        const response = await Axios.patch(API_ENDPOINTS.ADMIN_ISSUE_BY_ID(id), backendFormData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ISSUES PATCH]", err);
        return NextResponse.json({ message: "Gagal mengupdate issue." }, { status: 500 });
    }
};

/**
 * Handler untuk menghapus issue.
 * @param {Request} request
 * @param {Object} context
 */
export const DELETE = async (request, context) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const params = await context.params;
        const { id } = params;
        const response = await Axios.delete(API_ENDPOINTS.ADMIN_ISSUE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API ISSUES DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus issue." }, { status: 500 });
    }
};
