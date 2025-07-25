import axios from "axios";
import { API_ENDPOINTS } from "../../api";

export const getLogisticsPartsUsage = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.TOP_USED_PARTS, {
            withCredentials: true
        });
        return res.data?.data;
    } catch (err) {
        console.error("Failed to fetch logistics dashboard:", err);
        throw err;
    }
};
