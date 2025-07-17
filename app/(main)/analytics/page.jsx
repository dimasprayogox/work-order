"use client";
import { Chart } from "primereact/chart";
import { Sidebar } from "primereact/sidebar";
import { useState } from "react";

const AnalyticsPage = () => {
    const lateWorkOrdersByDueDate = {
        labels: ["Due Earlier Today", "Due Last Week", "Due 2 Weeks Ago", "Due More Than 2 Weeks Ago"],
        datasets: [
            {
                label: "Late Work Orders",
                data: [5, 12, 9, 17], // Customize these numbers for your use case
                backgroundColor: [
                    "#facc15", // yellow - today
                    "#fb923c", // orange - last week
                    "#f472b6", // pink - 2 weeks ago
                    "#ef4444" // red - more than 2 weeks ago
                ],
                borderWidth: 1
            }
        ]
    };

    const activeWOsbyPriority = {
        // labels: ['Due Earlier Today', 'Due Last Week', 'Due 2 Weeks Ago', 'Due More Than 2 Weeks Ago'],
        datasets: [
            {
                // label: 'Active WOs by Priority',
                data: [5, 12, 9, 17, 28], // Customize these numbers for your use case
                backgroundColor: [
                    "#3A59D1", // blue - no priority
                    "#5CB338", // green - low
                    "#FFF574", // yellow - medium
                    "#C80036", // dark red - high
                    "#FF0000" // bright red - highest
                ],
                borderWidth: 1
            }
        ]
    };

    const lateHighPriorityWorkOrders = {
        labels: ["Technician", "Manager", "Admin", "Logistics"],
        datasets: [
            {
                label: "Count of Work Orders",
                data: [20, 3, 9, 10],
                backgroundColor: "#3b82f6" // optional
            }
        ]
    };

    const [visible, setVisible] = useState(false);

    return (
        <div>
            <div className="grid">
                <div className="col-12 md:col-4">
                    <div className="grid">
                        <div className="col-6">
                            <div className="card text-center" style={{ minHeight: "190px" }}>
                                <h3>1009</h3>
                                <h5>Active</h5>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card text-center" style={{ minHeight: "190px" }}>
                                <h3>1</h3>
                                <h5>Due Later Today</h5>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card text-center" style={{ minHeight: "190px" }}>
                                <h3>600</h3>
                                <h5>Late</h5>
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="card text-center" style={{ minHeight: "190px" }}>
                                <h3>360</h3>
                                <h5>No Due Date</h5>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h3 className="font-semibold text-xl text-center">Late Work Orders</h3>

                        <div className="flex justify-content-center">
                            <Chart
                                type="doughnut"
                                data={lateWorkOrdersByDueDate}
                                options={{
                                    // maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h3 className="font-semibold text-xl text-center">Late High-Priority Work Orders</h3>

                        <div className="flex justify-content-center">
                            <Chart
                                type="bar"
                                data={lateHighPriorityWorkOrders}
                                options={{
                                    indexAxis: "y",
                                    maintainAspectRatio: false,
                                    aspectRatio: 1,
                                    plugins: {
                                        legend: false
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h3 className="font-semibold text-xl text-center">Active WOs by User</h3>

                        <div className="flex justify-content-center">
                            <Chart
                                type="bar"
                                data={lateHighPriorityWorkOrders}
                                options={{
                                    indexAxis: "y",
                                    maintainAspectRatio: false,
                                    aspectRatio: 1,
                                    plugins: {
                                        legend: false
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h3 className="font-semibold text-xl text-center">Active WOs by Type</h3>

                        <div className="flex justify-content-center">
                            <Chart
                                type="bar"
                                data={lateHighPriorityWorkOrders}
                                options={{
                                    indexAxis: "y",
                                    maintainAspectRatio: false,
                                    aspectRatio: 1,
                                    plugins: {
                                        legend: false
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-12 md:col-4">
                    <div className="card">
                        <h3 className="font-semibold text-xl text-center">Active WOs by Priority</h3>

                        <div className="flex justify-content-center">
                            <Chart
                                type="doughnut"
                                data={activeWOsbyPriority}
                                options={{
                                    // maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
