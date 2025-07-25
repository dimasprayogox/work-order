"use client";

import { Chart } from "primereact/chart";

const InventoryChart = ({ data }) => {
    const chartData = {
        labels: ["In Stock", "Low Stock", "Out of Stock"],
        datasets: [
            {
                data: [data.in_stock, data.low_stock, data.out_of_stock],
                backgroundColor: ["#4ade80", "#fbbf24", "#f87171"]
            }
        ]
    };

    return <Chart type="doughnut" data={chartData} />;
};

export default InventoryChart;
