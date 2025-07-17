export const API_URL = process.env.NEXT_PUBLIC_API_URL || "localhost:3100";

export const API_ENDPOINTS = {

    // Auth 
    LOGINUSERS: `${API_URL}/auth/login`,
    LOGOUT: `${API_URL}/auth/logout`,

    // Work Request
    GETALLWORKREQUEST: `${API_URL}/work-request`,

    // Work Order
    GETALLWORKORDER: `${API_URL}/work-order`,

    // Schedule Maintenancec List
    GETALLSCHEDULEMAINTENANCE: `${API_URL}/schedule-maintenance-list`,

    // Continent
    GETALLCONTINENT: `${API_URL}/continent`,

    // Parts forecaster
    GETALLPARTSFORECASTER: `${API_URL}/parts-forecaster`
};

