import React, { useMemo } from "react";
import { motion } from "framer-motion";

const StatusCards = ({ workOrders }) => {
    const { totalWorkOrders, pendingCount, inProgressCount, completedCount } = useMemo(() => {
        const total = workOrders.length;
        const pending = workOrders.filter((wo) => wo.status === "pending").length;
        const inProgress = workOrders.filter((wo) => wo.status === "in_progress").length;
        const completed = workOrders.filter((wo) => wo.status === "completed").length;

        return {
            totalWorkOrders: total,
            pendingCount: pending,
            inProgressCount: inProgress,
            completedCount: completed
        };
    }, [workOrders]);

    const cards = [
        {
            title: "TOTAL WORK ORDERS",
            value: totalWorkOrders,
            icon: "pi-briefcase",
            gradient: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            progress: 100
        },
        {
            title: "PENDING WORK ORDERS",
            value: pendingCount,
            icon: "pi-exclamation-triangle",
            gradient: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
            progress: totalWorkOrders > 0 ? (pendingCount / totalWorkOrders) * 100 : 0
        },
        {
            title: "IN PROGRESS WORK ORDERS",
            value: inProgressCount,
            icon: "pi-spinner",
            gradient: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
            progress: totalWorkOrders > 0 ? (inProgressCount / totalWorkOrders) * 100 : 0
        },
        {
            title: "COMPLETED WORK ORDERS",
            value: completedCount,
            icon: "pi-check-circle",
            gradient: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)",
            progress: totalWorkOrders > 0 ? (completedCount / totalWorkOrders) * 100 : 0
        }
    ];

    return (
        <div className="grid">
            {cards.map((card, index) => (
                <div key={index} className="col-6 md:col-3">
                    <motion.div
                        className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                        style={{
                            height: "180px",
                            background: card.gradient,
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                        <div className="text-center w-full">
                            <i className={`pi ${card.icon} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                            <h6 className="font-bold text-white mt-3 mb-1">{card.title}</h6>
                        </div>
                        <h3 className="text-4xl font-bold text-white my-2">{card.value}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${card.progress}%` }}></div>
                        </div>
                    </motion.div>
                </div>
            ))}
        </div>
    );
};

export default StatusCards;
