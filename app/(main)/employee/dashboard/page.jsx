"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Toast } from "primereact/toast";
import StatCard from "./components/StatCard";
import StatusPieChart from "./components/StatusPieChart";
import TrendBarChart from "./components/TrendBarChart";
import WorkOrdersTable from "./components/WorkOrdersTable";

const EmployeeDashboard = () => {
    const toast = useRef(null);
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

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchMyIssues = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/employee/dashboard/my-issues`, {
                method: "GET",
                credentials: "include"
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(`HTTP error! status: ${response.status}. Detail: ${errorResult.message || JSON.stringify(errorResult.errors)}`);
            }

            const result = await response.json();

            if (!result.data || !Array.isArray(result.data)) {
                throw new Error("Invalid data format from API");
            }

            const myIssues = result.data;
            setIssues(myIssues);

            const total = myIssues.length;
            const pending = myIssues.filter((req) => req.status === "open").length;
            const resolved = myIssues.filter((req) => req.status === "resolved").length;
            const inProgress = myIssues.filter((req) => req.status === "in_progress").length;

            setStats({ total, pending, resolved, inProgress });

            setChartData(
                [
                    { name: "Pending", value: pending, color: "#ef4444" },
                    { name: "In Progress", value: inProgress, color: "#06b6d4" },
                    { name: "Completed", value: resolved, color: "#10b981" }
                ].filter((item) => item.value > 0)
            );

            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            setTrendData(
                months.map((month, index) => {
                    const monthRequests = myIssues.filter((req) => {
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
            showToast("error", "Error fetching data", error.message);
            setIssues([]);
            setStats({ total: 0, pending: 0, resolved: 0, inProgress: 0 });
            setChartData([]);
            setTrendData([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchMyIssues();
    }, [fetchMyIssues]);

    return (
        <div className="card">
            <Toast ref={toast} position="top-right" />
            <h2 className="font-semibold text-2xl mb-4">Dashboard Employee</h2>

            <div className="grid">
                <StatCard title="TOTAL REQUEST" value={stats.total} loading={loading} icon="pi-inbox" gradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" progressValue={100} />

                <StatCard title="PENDING" value={stats.pending} loading={loading} icon="pi-clock" gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)" progressValue={(stats.pending / stats.total) * 100 || 0} />

                <StatCard title="IN PROGRESS" value={stats.inProgress} loading={loading} icon="pi-spinner" gradient="linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)" progressValue={(stats.inProgress / stats.total) * 100 || 0} />

                <StatCard title="COMPLETED" value={stats.resolved} loading={loading} icon="pi-check-circle" gradient="linear-gradient(135deg, #10b981 0%, #22c55e 100%)" progressValue={(stats.resolved / stats.total) * 100 || 0} />
            </div>

            <div className="grid mt-4">
                <div className="col-12 md:col-6">
                    <StatusPieChart data={chartData} loading={loading} title="Work Request Status Distribution" />
                </div>

                <div className="col-12 md:col-6">
                    <TrendBarChart data={trendData} loading={loading} title="Monthly Work Request Trend" />
                </div>
            </div>

            <div className="grid mt-4">
                <div className="col-12">
                    <WorkOrdersTable issues={issues} loading={loading} statusFilter={statusFilter} setStatusFilter={setStatusFilter} searchText={searchText} setSearchText={setSearchText} />
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
