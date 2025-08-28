import React from "react";
import { Skeleton } from "primereact/skeleton";

const StatCard = ({ title, value, loading, icon, gradient, progressValue }) => {
    return (
        <div className="col-6 md:col-3">
            <div
                className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                style={{
                    height: "180px",
                    background: gradient,
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                }}
            >
                <div className="text-center w-full">
                    <i className={`pi ${icon} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                    <h6 className="font-bold text-white mt-3 mb-1">{title}</h6>
                </div>
                {loading ? <Skeleton className="h-4rem w-full" /> : <h3 className="text-4xl font-bold text-white my-2">{value}</h3>}
                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${progressValue}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
