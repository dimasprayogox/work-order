import { NextResponse } from "next/server";
import { isAxiosError } from "axios";
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";

export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        const responseData = await Axios.get(API_ENDPOINTS.LOGISTICS_DASHBOARD, authHeader)
      
        return NextResponse.json(responseData.data);
    } catch (err) {
         if (isAxiosError(err) && err.response) {
             return NextResponse.json(err.response.data, { status: err.response.status });
         }

        console.error("[API LOGISTICS DASHBOARD]", err);
        return NextResponse.json(
            {
                success: false,
                message: "Gagal mengambil data dashboard logistics."
            },
            { status: 500 }
        );
    }
};

