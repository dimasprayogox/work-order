"use client";

const StatusBadge = ({ status }) => {
    const statusMap = {
        pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
        approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
        fulfilled: { label: "Fulfilled", color: "bg-green-100 text-green-800" },
        rejected: { label: "Rejected", color: "bg-red-100 text-red-800" }
    };

    return <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusMap[status]?.color}`}>{statusMap[status]?.label}</span>;
};

export default StatusBadge;
