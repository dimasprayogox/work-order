"use client";

import { Card } from "primereact/card";

const PartSummary = ({ title, value, icon, color }) => {
    // Define color gradients for different metrics
    const colorGradients = {
        total: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        low: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
        out: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
        critical: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
    };

    // Icon mapping
    const iconMap = {
        total: "pi pi-box",
        low: "pi pi-exclamation-triangle",
        out: "pi pi-ban",
        critical: "pi pi-exclamation-circle"
    };

    return (
        <div className="col-6 md:col-3">
            <div
                className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                style={{
                    height: "180px",
                    background: colorGradients[color] || colorGradients.total,
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
            >
                <div className="text-center w-full">
                    <i className={`${iconMap[icon] || "pi pi-box"} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                    <h6 className="font-bold text-white mt-3 mb-1">{title}</h6>
                </div>
                <h3 className="text-4xl font-bold text-white my-2">{value}</h3>
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: "100%" }}></div>
                </div>
            </div>
        </div>
    );
};

export default PartSummary;
