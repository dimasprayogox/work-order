import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const StatusPieChart = ({ data, title }) => {
    return (
        <div className="card flex flex-column align-items-center justify-content-center overflow-hidden p-4" style={{ minHeight: "400px" }}>
            <h5 className="font-bold mb-4 self-start">{title}</h5>
            <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StatusPieChart;
