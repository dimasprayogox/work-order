import React from "react";
import { ProgressSpinner } from "primereact/progressspinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const TrendBarChart = ({ data, loading, title }) => {
    const hasData = !data.every((d) => d.issues === 0 && d.resolved === 0);

    return (
        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
            <h5 className="font-bold mb-4 self-start">{title}</h5>
            {loading || !hasData ? (
                <ProgressSpinner />
            ) : (
                <div style={{ width: "100%", height: "350px" }}>
                    <ResponsiveContainer>
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="issues" name="Request" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resolved" name="Completed" fill="#22C55E" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default TrendBarChart;
