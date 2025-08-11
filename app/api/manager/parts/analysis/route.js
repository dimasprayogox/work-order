import { Axios } from "../../../../utils/axios";
import { API_ENDPOINTS } from "../../../api";
import { NextResponse } from "next/server";
import { isAxiosError } from "axios";

/**
 * @name GET
 * @description Consolidated proxy route to fetch all parts analysis data required for the manager dashboard.
 * This fetches data from multiple backend endpoints and combines them into a single response.
 * @param {Request} request - The incoming Next.js request object.
 */
export const GET = async (request) => {
    const token = request.cookies.get("authToken")?.value;
    if (!token) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const authHeader = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch data from two different backend endpoints in parallel
        // Using Promise.allSettled to ensure that even if one call fails, the other can still be processed.
        const [partsAnalysisResponse, topUsedPartsResponse] = await Promise.allSettled([
            Axios.get(API_ENDPOINTS.MANAGER_PARTS_ANALYSIS, authHeader),
            Axios.get(API_ENDPOINTS.LOGISTICS_TOP_USED_PARTS, authHeader)
        ]);

        // Initialize the combined data object with default empty arrays
        const combinedData = {
            mostUsedParts: [],
            technicianPartUsage: [],
            criticalStock: []
        };

        // Process the response from the general parts analysis endpoint
        if (partsAnalysisResponse.status === 'fulfilled' && partsAnalysisResponse.value.data) {
            const data = partsAnalysisResponse.value.data;
            // Assuming this endpoint returns technicianPartUsage and criticalStock
            combinedData.technicianPartUsage = data.technicianPartUsage || [];
            combinedData.criticalStock = data.criticalStock || [];
        } else if (partsAnalysisResponse.status === 'rejected') {
            console.error("Error fetching general parts analysis data:", partsAnalysisResponse.reason);
        }

        // Process the response from the top used parts endpoint
        if (topUsedPartsResponse.status === 'fulfilled' && topUsedPartsResponse.value.data) {
            // Assuming this endpoint returns an array directly
            combinedData.mostUsedParts = topUsedPartsResponse.value.data;
        } else if (topUsedPartsResponse.status === 'rejected') {
            console.error("Error fetching top used parts data:", topUsedPartsResponse.reason);
        }

        // Return the combined data to the client
        return NextResponse.json({ data: combinedData });

    } catch (err) {
        if (isAxiosError(err) && err.response) {
            return NextResponse.json(err.response.data, { status: err.response.status });
        }
        console.error("[API MANAGER PARTS ANALYSIS PROXY]", err);
        return NextResponse.json({ message: "Gagal mengambil data analisis suku cadang manajer." }, { status: 500 });
    }
};
