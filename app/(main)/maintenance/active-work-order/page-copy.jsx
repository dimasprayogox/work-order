// import React from "react";
import { Bar } from "react-chartjs-2";

const BarCell = ({ value, max }) => {
    const percentage = (value / max) * 100;
    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <div
                style={{
                    width: `${percentage}%`,
                    backgroundColor: "#4A90E2",
                    height: "10px",
                    marginRight: "8px"
                }}
            />
            <span>{value}</span>
        </div>
    );
};

const data = [
    { name: "Preventive", count: 400 },
    { name: "Corrective", count: 195 },
    { name: "Health & Safety", count: 154 }
    // more rows...
];

const maxCount = Math.max(...data.map((d) => d.count));

export default function TableWithBarChart() {
    return (
        <table>
            <thead>
                <tr>
                    <th>Maintenance Type</th>
                    <th>Count of Work Orders</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row, i) => (
                    <tr key={i}>
                        <td>{row.name}</td>
                        <td>
                            <BarCell value={row.count} max={maxCount} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
