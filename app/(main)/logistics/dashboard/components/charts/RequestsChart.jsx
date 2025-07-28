"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const RequestsChart = ({ data }) => {
    const pieData = [
        { name: "Pending", value: data.pending, color: "#fbbf24" },
        { name: "Approved", value: data.approved, color: "#60a5fa" },
        { name: "Fulfilled", value: data.fulfilled, color: "#34d399" },
        { name: "Rejected", value: data.rejected, color: "#f87171" }
    ];

    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

export default RequestsChart;
