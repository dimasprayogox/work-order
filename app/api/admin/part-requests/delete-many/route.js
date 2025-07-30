// api/admin/part-requests/delete-many/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * Handler untuk menghapus multiple part requests.
 * @param {Request} request
 */
export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            return NextResponse.json({
                message: "Invalid input: 'ids' must be a non-empty array."
            }, { status: 400 });
        }

        const response = await Axios.post(API_ENDPOINTS.ADMIN_PART_REQUEST_DELETE_MANY, {
            ids: body.ids
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API PART REQUEST DELETE MANY]", err);
        return NextResponse.json({ message: "Gagal menghapus part requests." }, { status: 500 });
    }
};
