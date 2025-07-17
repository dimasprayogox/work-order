"use client";

import { Button } from "primereact/button";
import { Chart } from "primereact/chart";

const ClosedWorkOrderPage = () => {
    const closeWorkOrder = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
            {
                label: "Low Risk Severity",
                data: [65, 59, 80, 81, 56, 55, 40],
                fill: true,
                tension: 0.4
            },
            {
                label: "High Risk Severity",
                data: [28, 48, 40, 19, 86, 27, 90],
                fill: true,
                tension: 0.4
            }
        ]
    };
    return (
        <div>
            <div className="card">
                <Chart
                    type="line"
                    data={closeWorkOrder}
                    options={{
                        maintainAspectRatio: false,
                        aspectRatio: 1
                    }}
                />
            </div>
        </div>
    );
};

export default ClosedWorkOrderPage;
