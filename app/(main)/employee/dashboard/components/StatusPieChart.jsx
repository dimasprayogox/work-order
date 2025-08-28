import React from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const StatusPieChart = ({ data, loading, title }) => {
    return (
        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
            <h5 className="font-bold mb-4 self-start">{title}</h5>
            {loading || data.length === 0 ? (
                <ProgressSpinner />
            ) : (
                <div style={{ width: "100%", height: "350px" }}>
                    <ResponsiveContainer>
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
            )}
        </div>
    );
};

export default StatusPieChart;
