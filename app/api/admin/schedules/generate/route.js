// api/admin/schedules/generate/route.js
import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        if (!body.ids || !Array.isArray(body.ids)) {
            return NextResponse.json({ message: "Invalid input: 'ids' must be a non-empty array of schedule IDs." }, { status: 400 });
        }

        if (body.ids.length === 0) {
            return NextResponse.json({ message: "Invalid input: 'ids' array cannot be empty." }, { status: 400 });
        }

        const response = await Axios.post(API_ENDPOINTS.ADMIN_SCHEDULES_GENERATE, body, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        return NextResponse.json(response.data, { status: 200 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API SCHEDULES GENERATE]", err);
        return NextResponse.json({ message: "Gagal generate work orders." }, { status: 500 });
    }
};
