"use client";

import { motion } from "framer-motion";

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { label: "Pending", color: "#f97316", bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi-clock" },
        approved: { label: "Approved", color: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-800", icon: "pi-check" },
        fulfilled: { label: "Fulfilled", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
        rejected: { label: "Rejected", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle" },
        };

    const config = statusConfig[status.toLowerCase()] || {
        label: status,
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        icon: "pi-question"
    };

    return (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                <i className={`pi ${config.icon}`}></i>
                <span className="font-medium">{config.label}</span>
            </div>
        </motion.div>
    );
};

export default StatusBadge;
