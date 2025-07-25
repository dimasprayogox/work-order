import axios from "axios";
import { API_ENDPOINTS } from "../../api";

export const getLogisticsDashboard = async () => {
    try {
        const res = await axios.get(API_ENDPOINTS.LOGISTICS_DASHBOARD, {
            withCredentials: true
        });
        return res.data?.data;
    } catch (err) {
        console.error("Failed to fetch logistics dashboard:", err);
        throw err;
    }
};
