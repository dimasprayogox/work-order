import { NextResponse } from "next/server";
import { isAxiosError } from "axios";
import { Axios } from "../../../utils/axios";
import { API_ENDPOINTS } from "../../api";

/**
 * @name GET
 * @description Proxy route to fetch the most used parts data from the backend API.
 * @param {Request} request - The incoming Next.js request object.
 */
export const GET = async (request) => {
    // Get the auth token from the request cookies
    const token = request.cookies.get("authToken")?.value;
    
    // Check if the token exists, otherwise return an Unauthorized response
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Prepare the authorization header
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };
        
        // Make the GET request to the backend API endpoint for top used parts
        // API_ENDPOINTS.LOGISTICS_TOP_USED_PARTS should be the correct endpoint
        const topUsedPartsResponse = await Axios.get(API_ENDPOINTS.LOGISTICS_TOP_USED_PARTS, authHeader);

        // Return the data received from the backend
        return NextResponse.json(topUsedPartsResponse.data);

    } catch (err) {
        // Handle Axios errors, extracting the response data and status if available
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }

        // Log the error for debugging purposes
        console.error("[API GET TOP USED PARTS]", err);
        
        // Return a generic server error response if the error is not an Axios error or lacks a response
        return NextResponse.json(
            {
                success: false,
                message: "Gagal mengambil data part yang sering digunakan."
            },
            { status: 500 }
        );
    }
};

