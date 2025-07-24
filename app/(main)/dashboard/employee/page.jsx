/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "primereact/card";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "primereact/skeleton";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

const statusOptions = [
    { label: "All Status", value: "" },
    { label: "Pending", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "resolved" }
];

const EmployeeDashboard = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
        inProgress: 0
    });
    const [chartData, setChartData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    const fetchWorkRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/employee/issues/my-issues`, {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.data || !Array.isArray(result.data)) {
                throw new Error("Invalid data format from API");
            }

            const workRequests = result.data;
            setIssues(workRequests);

            // Calculate statistics
            const total = workRequests.length;
            const pending = workRequests.filter((req) => req.status === "open").length;
            const resolved = workRequests.filter((req) => req.status === "resolved").length;
            const inProgress = workRequests.filter((req) => req.status === "in_progress").length;

            setStats({ total, pending, resolved, inProgress });

            // Prepare chart data
            setChartData([
                { name: "Pending", value: pending, color: "#ef4444" },
                { name: "In Progress", value: inProgress, color: "#06b6d4" },
                { name: "Completed", value: resolved, color: "#10b981" }
            ]);

            // Prepare trend data
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            setTrendData(
                months.map((month, index) => {
                    const monthRequests = workRequests.filter((req) => {
                        const reqDate = new Date(req.created_at);
                        return reqDate.getMonth() === index && reqDate.getFullYear() === new Date().getFullYear();
                    });

                    return {
                        name: month,
                        issues: monthRequests.length,
                        resolved: monthRequests.filter((req) => req.status === "resolved").length
                    };
                })
            );
        } catch (error) {
            console.error("Error fetching work requests:", error);
            setIssues([]);
            setStats({ total: 0, pending: 0, resolved: 0, inProgress: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWorkRequests();
    }, [fetchWorkRequests]);

    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            open: {
                label: "Pending",
                color: "#ef4444",
                bgColor: "bg-red-100",
                textColor: "text-red-800",
                icon: "pi-clock"
            },
            in_progress: {
                label: "In Progress",
                color: "#3b82f6",
                bgColor: "bg-blue-100",
                textColor: "text-blue-800",
                icon: "pi-spinner pi-spin"
            },
            resolved: {
                label: "Completed",
                color: "#10b981",
                bgColor: "bg-green-100",
                textColor: "text-green-800",
                icon: "pi-check"
            }
        };

        const config = statusConfig[rowData.status] || {
            label: rowData.status,
            color: "gray",
            bgColor: "bg-gray-100",
            textColor: "text-gray-800",
            icon: "pi-question"
        };
        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const dateBodyTemplate = (rowData) => {
        return rowData.created_at ? new Date(rowData.created_at).toLocaleString("id-ID") : "N/A";
    };

    const machineBodyTemplate = (rowData) => {
        return <Tag value={rowData.machine?.name || "N/A"} className="bg-gray-100 text-gray-800 font-medium" />;
    };

    const filteredData = issues.filter((request) => {
        const matchesStatus = !statusFilter || request.status === statusFilter;
        const matchesSearch = !searchText || request.title.toLowerCase().includes(searchText.toLowerCase()) || (request.description && request.description.toLowerCase().includes(searchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="card">
            <h2 className="font-semibold text-2xl mb-4">Dashboard</h2>

            {/* Top Stats Cards */}
            <div className="grid">
                {/* Card 1 - Total Request */}
                <div className="col-6 md:col-3">
                    <div
                        className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                        style={{
                            height: "180px",
                            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        <div className="text-center w-full">
                            <i className="pi pi-inbox text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                            <h6 className="font-bold text-white mt-3 mb-1">TOTAL REQUEST</h6>
                        </div>
                        <h3 className="text-4xl font-bold text-white my-2">{stats.total}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: "100%" }}></div>
                        </div>
                    </div>
                </div>

                {/* Card 2 - Pending Request */}
                <div className="col-6 md:col-3">
                    <div
                        className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                        style={{
                            height: "180px",
                            background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        <div className="text-center w-full">
                            <i className="pi pi-clock text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                            <h6 className="font-bold text-white mt-3 mb-1">PENDING</h6>
                        </div>
                        <h3 className="text-4xl font-bold text-white my-2">{stats.pending}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Card 3 - In Progress */}
                <div className="col-6 md:col-3">
                    <div
                        className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                        style={{
                            height: "180px",
                            background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        <div className="text-center w-full">
                            <i className="pi pi-spinner text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                            <h6 className="font-bold text-white mt-3 mb-1">IN PROGRESS</h6>
                        </div>
                        <h3 className="text-4xl font-bold text-white my-2">{stats.inProgress}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Card 4 - Completed */}
                <div className="col-6 md:col-3">
                    <div
                        className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden"
                        style={{
                            height: "180px",
                            background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)",
                            borderRadius: "12px",
                            boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                        }}
                    >
                        <div className="text-center w-full">
                            <i className="pi pi-check-circle text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                            <h6 className="font-bold text-white mt-3 mb-1">COMPLETED</h6>
                        </div>
                        <h3 className="text-4xl font-bold text-white my-2">{stats.resolved}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${(stats.resolved / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid mt-4">
                <div className="col-12 md:col-6">
                    <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
                        <h5 className="font-bold mb-4 self-start">Work Request Status Distribution</h5>
                        {loading ? (
                            <ProgressSpinner />
                        ) : (
                            <div style={{ width: "100%", height: "350px" }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                            {chartData.map((entry, index) => (
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
                </div>

                <div className="col-12 md:col-6">
                    <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
                        <h5 className="font-bold mb-4 self-start">Monthly Work Request Trend</h5>
                        {loading ? (
                            <ProgressSpinner />
                        ) : (
                            <div style={{ width: "100%", height: "350px" }}>
                                <ResponsiveContainer>
                                    <BarChart data={trendData}>
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
                </div>
            </div>

            {/* Recent Work Orders Table */}
            <div className="grid mt-4">
                <div className="col-12">
                    <div className="card overflow-hidden">
                        <h5 className="font-bold mb-4">Recent Work Orders</h5>
                        {loading ? (
                            <div className="flex justify-center p-4">
                                <ProgressSpinner />
                            </div>
                        ) : (
                            <DataTable
                                value={filteredData.slice(0, 5)}
                                className="border-round-lg"
                                rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                paginator
                                rows={5}
                                rowsPerPageOptions={[5, 10, 25]}
                                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} requests"
                                emptyMessage="No work orders found"
                                header={
                                    <div className="flex align-items-center justify-content-between gap-2">
                                        <div>
                                            <span className="text-xl font-bold mr-3">Work Requests</span>
                                            <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-10rem" />
                                        </div>
                                        <InputText placeholder="Search" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                    </div>
                                }
                            >
                                <Column
                                    field="title"
                                    header="Title"
                                    sortable
                                    body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )}
                                />
                                <Column field="machine.name" header="Machine" body={machineBodyTemplate} sortable sortField="machine.name" />
                                <Column field="created_at" header="Reported Date" body={dateBodyTemplate} sortable />
                                <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            </DataTable>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default EmployeeDashboard;