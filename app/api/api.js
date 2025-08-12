// app/api/api.js
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

export const API_ENDPOINTS = {
    // --- Auth Endpoints ---
    LOGINUSERS: `${API_URL}/auth/login`,
    LOGOUT: `${API_URL}/auth/logout`,

    // --- General & Legacy Endpoints ---
    GETALLWORKREQUEST: `${API_URL}/work-request`,
    GETALLWORKORDER: `${API_URL}/work-order`,
    GETALLSCHEDULEMAINTENANCE: `${API_URL}/schedule-maintenance-list`,
    GETALLCONTINENT: `${API_URL}/continent`,
    GETALLPARTSFORECASTER: `${API_URL}/parts-forecaster`,

    // detail profile
    GET_DETAIL_PROFILE: `${API_URL}/user-detail`,

    // --- Technician Endpoints ---
    GET_TECHNICIAN_DASHBOARD_OVERVIEW: `${API_URL}/technician/dashboard/overview`,
    GET_TECHNICIAN_OVERDUE_WORK_ORDERS: `${API_URL}/technician/dashboard/work-orders/overdue`,
    GET_TECHNICIAN_WORK_ORDERS: `${API_URL}/technician/work-orders`,
    TECHNICIAN_WORK_ORDER_BY_ID: (id) => `${API_URL}/technician/work-orders/${id}`,
    TECHNICIAN_PART_REQUEST_BASE: `${API_URL}/technician/part-request`,
    TECHNICIAN_PART_REQUEST_BY_ID: (id) => `${API_URL}/technician/part-request/${id}`,
    TECHNICIAN_PART_BASE: `${API_URL}/technician/part-request/part`,

    // --- Logistics Endpoints ---
    LOGISTICS_DASHBOARD: `${API_URL}/logistics/dashboard`,
    LOGISTICS_PARTS: `${API_URL}/logistics/parts`,
    LOGISTICS_DELETE_PARTS_MANY: `${API_URL}/logistics/parts/delete-many`,
    LOGISTICS_PART_REQUESTS: `${API_URL}/logistics/part-requests`,
    LOGISTICS_PART_REQUEST_BY_ID: (id) => `${API_URL}/logistics/part-requests/${id}`,
    LOGISTICS_TOP_USED_PARTS: `${API_URL}/logistics/part-usage/top-used-parts`,
    LOGISTICS_USAGE_LOG: `${API_URL}/logistics/part-usage/usage-log`,
    LOGISTICS_PARTS_BY_ID: (id) => `${API_URL}/logistics/parts/${id}`,

    // --- Admin Endpoints ---
    ADMIN_DASHBOARD_OVERVIEW: `${API_URL}/admin/dashboard/overview`,
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
    ADMIN_ISSUES: `${API_URL}/admin/issues`,
    ADMIN_ISSUE_BY_ID: (id) => `${API_URL}/admin/issues/${id}`,
    ADMIN_ISSUES_DELETE_MANY: `${API_URL}/admin/issues/delete-many`,
    ADMIN_WORK_ORDER_ASSIGNMENTS: `${API_URL}/admin/work-order-assignments`,
    ADMIN_WORK_ORDER_ASSIGN: `${API_URL}/admin/work-order-assignments/assign`,
    ADMIN_WORK_ORDER_BULK_ASSIGN: `${API_URL}/admin/work-order-assignments/bulk-assign`,
    ADMIN_WORK_ORDER_REASSIGN: (id) => `${API_URL}/admin/work-order-assignments/${id}/reassign`,
    ADMIN_WORK_ORDER_UNASSIGN: (id) => `${API_URL}/admin/work-order-assignments/${id}/unassign`,
    ADMIN_WORK_ORDER_ASSIGNMENT_TECHNICIANS: `${API_URL}/admin/work-order-assignments/technicians`,
    ADMIN_WORK_ORDER_ASSIGNMENT_STATS: `${API_URL}/admin/work-order-assignments/stats`,
    ADMIN_SCHEDULES: `${API_URL}/admin/schedules`,
    ADMIN_SCHEDULE_BY_ID: (id) => `${API_URL}/admin/schedules/${id}`,
    ADMIN_SCHEDULES_GENERATE: `${API_URL}/admin/schedules/generate`,

    // --- Manager Endpoints ---
    MANAGER_DASHBOARD_OVERVIEW: `${API_URL}/manager/dashboard/overview`,
    MANAGER_WORK_ORDERS: `${API_URL}/manager/work-orders`,
    MANAGER_WORK_ORDER_BY_ID: (id) => `${API_URL}/manager/work-orders/${id}`,
    MANAGER_WORK_ORDERS_DELETE_MANY: `${API_URL}/manager/work-orders/delete-many`,
    MANAGER_MACHINES: `${API_URL}/manager/machines`,
    MANAGER_MAINTENANCE_SCHEDULES: `${API_URL}/manager/schedules`,
    MANAGER_MAINTENANCE_SCHEDULES_DELETE_MANY: `${API_URL}/manager/schedules/delete-many`,
    MANAGER_SCHEDULE_BY_ID: (id) => `${API_URL}/manager/schedules/${id}`,
    MANAGER_ASSIGN_TECHNICIAN: (id) => `${API_URL}/manager/work-orders/${id}/assign-technician`,
    MANAGER_TECHNICIANS_AVAILABLE: `${API_URL}/manager/technicians/available`,

    // --- Employee Endpoints ---
    EMPLOYEE_MY_ISSUES: `${API_URL}/employee/issues/my-issues`,
    EMPLOYEE_ISSUES: `${API_URL}/employee/issues`,
    EMPLOYEE_DELETE_ISSUES_MANY: `${API_URL}/employee/issues/delete-many`,
    EMPLOYEE_ISSUE_BY_ID: (id) => `${API_URL}/employee/issues/${id}`,
    EMPLOYEE_AVAILABLE_MACHINES: `${API_URL}/employee/machines/available`
};
