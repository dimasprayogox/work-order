import React from "react";

const StatCard = ({ title, value, icon, bgColor, percentage }) => (
    <div className="col-6 md:col-3">
        <div
            className="flex flex-column justify-content-between p-3 overflow-hidden h-full"
            style={{
                borderRadius: "12px",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                backgroundColor: bgColor
            }}
        >
            <div className="text-center w-full">
                <i className={`pi ${icon} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                <h6 className="font-bold text-white mt-3 mb-1 uppercase text-sm">{title}</h6>
            </div>
            <h3 className="text-4xl font-bold text-white my-2 text-center">{isNaN(value) ? 0 : value}</h3>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: `${isNaN(percentage) ? 0 : percentage}%` }}></div>
            </div>
        </div>
    </div>
);

export default StatCard;
