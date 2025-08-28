"use client";

import { Tag } from "primereact/tag";



const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800" },
        approved: { label: "Approved", color: "bg-yellow-100 text-yellow-800"},
        fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
        rejected: { label: "Rejected", color: "bg-red-100 text-red-800" }
    };

    const config = statusConfig[status.toLowerCase()] || {
        label: status,
        color: "bg-gray-100 text-gray-800"
    };

    return (
        <Tag value={config.label} className={config.color}style={{ minWidth: "75px", display: "inline-flex", justifyContent: "center" }} />
)
};

export default StatusBadge;
