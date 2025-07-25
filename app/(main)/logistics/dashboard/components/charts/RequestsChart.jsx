"use client";

import { Chart } from "primereact/chart";

const RequestsChart = ({ data }) => {
    const chartData = {
        datasets: [
            {
                data: [data.pending, data.approved, data.rejected],
                backgroundColor: ["#fbbf24", "#60a5fa", "#f87171"]
            }
        ]
    };

    return (
        <div style={{ width: "250px", height: "250px" }}>
            <Chart type="pie" data={chartData} />
        </div>
    );
};

export default RequestsChart;
