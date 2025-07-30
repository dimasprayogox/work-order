import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

export async function GET(request, { params }) {
    const { id } = params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const response = await Axios.get(API_ENDPOINTS.LOGISTICS_PARTS_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API LOGISTICS PARTS GET BY ID]", err);
        return NextResponse.json({ message: "Gagal mengambil detail parts." }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    const { id } = params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const response = await Axios.patch(API_ENDPOINTS.LOGISTICS_PARTS_BY_ID(id), body, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json(response.data);
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API LOGISTICS PARTS PUT]", err);
        return NextResponse.json({ message: "Gagal mengupdate data part." }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    const token = request.cookies.get("authToken")?.value;

    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await Axios.delete(API_ENDPOINTS.LOGISTICS_PARTS_BY_ID(id), {
            headers: { Authorization: `Bearer ${token}` }
        });
        return NextResponse.json({ message: "Part berhasil dihapus." }, { status: 200 });
    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API LOGISTICS PART DELETE]", err);
        return NextResponse.json({ message: "Gagal menghapus parts." }, { status: 500 });
    }
}
