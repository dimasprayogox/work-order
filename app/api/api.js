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
    GETALLPARTSFORECASTER: `${API_URL}/parts-forecaster`,

    //logistics
    // Dashboard
    LOGISTICS_DASHBOARD: `${API_URL}/logistics/dashboard`,
    // Parts
    PARTS: `${API_URL}/logistics/parts`,

    // --- Technician Endpoints ---
        GET_TECHNICIAN_DASHBOARD_OVERVIEW: `${API_URL}/technician/dashboard/overview`,
        GET_TECHNICIAN_OVERDUE_WORK_ORDERS: `${API_URL}/technician/dashboard/work-orders/overdue`,
        GET_TECHNICIAN_WORK_ORDERS: `${API_URL}/technician/work-orders`,
        TECHNICIAN_WORK_ORDER_BY_ID: (id) => `${API_URL}/technician/work-orders/${id}`,
        TECHNICIAN_PART_REQUEST_BASE: `${API_URL}/technician/part-request`,
        TECHNICIAN_PART_REQUEST_BY_ID: (id) => `${API_URL}/technician/part-request/${id}`,
        TECHNICIAN_PART_BASE: `${API_URL}/technician/part-request/part`,
    // Part Requests
    PART_REQUESTS: `${API_URL}/logistics/part-requests`,
    // Part Usage
    TOP_USED_PARTS: `${API_URL}/logistics/part-usage/top-used`,
    USAGE_LOG: `${API_URL}/logistics/part-usage/log`,
};

