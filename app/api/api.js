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



    // --- Technician Endpoints ---
    GET_TECHNICIAN_DASHBOARD_OVERVIEW: `${API_URL}/technician/dashboard/overview`,
    GET_TECHNICIAN_OVERDUE_WORK_ORDERS: `${API_URL}/technician/dashboard/work-orders/overdue`,
    GET_TECHNICIAN_WORK_ORDERS: `${API_URL}/technician/work-orders`,
    TECHNICIAN_WORK_ORDER_BY_ID: (id) => `${API_URL}/technician/work-orders/${id}`,
    TECHNICIAN_PART_REQUEST_BASE: `${API_URL}/technician/part-request`,
    TECHNICIAN_PART_REQUEST_BY_ID: (workOrderId) => `${API_URL}/technician/part-request/${workOrderId}`,
    TECHNICIAN_PART_BASE: `${API_URL}/technician/part-request/part`,
    GET_TECHNICIAN_DASHBOARD_OVERVIEW: `${API_URL}/technician/dashboard/overview`,
    GET_TECHNICIAN_OVERDUE_WORK_ORDERS: `${API_URL}/technician/dashboard/work-orders/overdue`,
    GET_TECHNICIAN_WORK_ORDERS: `${API_URL}/technician/work-orders`,
    TECHNICIAN_WORK_ORDER_BY_ID: (id) => `${API_URL}/technician/work-orders/${id}`,
    TECHNICIAN_PART_REQUEST_BASE: `${API_URL}/technician/part-request`,
    TECHNICIAN_PART_REQUEST_BY_ID: (id) => `${API_URL}/technician/part-request/${id}`,
    TECHNICIAN_PART_BASE: `${API_URL}/technician/part-request/part`,

    //logistics
    LOGISTICS_DASHBOARD: `${API_URL}/logistics/dashboard`,
    PARTS: `${API_URL}/logistics/parts`,
    PART_REQUESTS: `${API_URL}/logistics/part-requests`,
    TOP_USED_PARTS: `${API_URL}/logistics/part-usage/top-used-parts`,
    USAGE_LOG: `${API_URL}/logistics/part-usage/log`,

    // Admin
    USERS: `${API_URL}/admin/users`,
    USER_BY_ID: (id) => `${API_URL}/admin/users/${id}`,
    DELETE_USERS_MANY: `${API_URL}/admin/users/delete-many`,
    MACHINE_CATEGORIES: `${API_URL}/admin/machine-categories`,
    MACHINE_CATEGORY_BY_ID: (id) => `${API_URL}/admin/machine-categories/${id}`,
    DELETE_MANY_MACHINE_CATEGORIES: `${API_URL}/admin/machine-categories/delete-many`,
    MACHINES: `${API_URL}/admin/machines`,
    MACHINE_BY_ID: (id) => `${API_URL}/admin/machines/${id}`,
    DELETE_MANY_MACHINES: `${API_URL}/admin/machines/delete-many`,
    AVAILABLE_MACHINES: `${API_URL}/admin/machines/available`,
    ADMIN_PARTS: `${API_URL}/admin/parts`,
    ADMIN_PARTS_BY_ID: (id) => `${API_URL}/admin/parts/${id}`,
    ADMIN_PARTS_DELETE_MANY: `${API_URL}/admin/parts/delete-many`,
    ADMIN_PART_REQUESTS: `${API_URL}/admin/part-requests`,
    ADMIN_PART_REQUEST_BY_ID: (id) => `${API_URL}/admin/part-requests/${id}`,
    ADMIN_PART_REQUEST_STATUS: (id) => `${API_URL}/admin/part-requests/${id}/status`,
    ADMIN_PART_REQUEST_DELETE_MANY: `${API_URL}/admin/part-requests/delete-many`,
};

