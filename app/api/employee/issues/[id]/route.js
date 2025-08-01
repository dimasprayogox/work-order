import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const PATCH = async (request, contex) => {
    const { id } = contex.params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
        return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
    }
    try {
        const form = await request.formData();
        const body = new FormData();
        form.forEach((value, key) => body.append(key, value));

        const response = await Axios.patch(API_ENDPOINTS.EMPLOYEE_ISSUE_BY_ID(id), body, {
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
        console.error(`[API EMPLOYEE ISSUES PATCH PROXY - ID: ${id}]`, err);
        return NextResponse.json({ message: "Gagal memperbarui isu." }, { status: 500 });
    }
};

export const DELETE = async (request, contex) => {
    const { id } = contex.params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!id) {
        return NextResponse.json({ message: "Issue ID is required" }, { status: 400 });
    }

    try {
        const response = await Axios.delete(API_ENDPOINTS.EMPLOYEE_ISSUE_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error(`[API EMPLOYEE ISSUES DELETE PROXY - ID: ${id}]`, err);
        return NextResponse.json({ message: "Gagal menghapus isu." }, { status: 500 });
    }
};
