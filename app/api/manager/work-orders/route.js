import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const response = await Axios.get(API_ENDPOINTS.MANAGER_WORK_ORDERS, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MANAGER WORK ORDERS PROXY]", err);
        return NextResponse.json({ message: "Gagal mengambil work orders." }, { status: 500 });
    }
};

export const POST = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    try {
        const body = await request.json();

        // Handle delete many request
        if (body.ids && Array.isArray(body.ids)) {
            const response = await Axios.post(API_ENDPOINTS.MANAGER_WORK_ORDERS_DELETE_MANY, body, { headers: { Authorization: `Bearer ${token}` } });
            return NextResponse.json(response.data, { status: 200 });
        }

        // Handle regular create request
        const response = await Axios.post(API_ENDPOINTS.MANAGER_WORK_ORDERS, body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MANAGER WORK ORDERS POST PROXY]", err);
        return NextResponse.json({ message: "Gagal membuat work order." }, { status: 500 });
    }
};