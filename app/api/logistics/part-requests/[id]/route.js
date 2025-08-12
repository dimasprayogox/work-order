import { NextResponse } from "next/server";
import { isAxiosError } from "axios";
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";

export const PATCH = async (request, { params }) => {
    const { id } = params;

    if (!id) {
        return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        const url = API_ENDPOINTS.LOGISTICS_PART_REQUEST_BY_ID(id);

        const response = await Axios.patch(url, body, {
            headers: { Authorization: `Bearer ${token}` }
        });

        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err)) {
            console.error("Error details:", {
                status: err.response?.status,
                data: err.response?.data,
                url: err.config?.url
            });
            return NextResponse.json(err.response?.data || { message: "Axios error" }, { status: err.response?.status || 500 });
        }
        return NextResponse.json({ message: "Gagal mengupdate status part request." }, { status: 500 });
    }
};
