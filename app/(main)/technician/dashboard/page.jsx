"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import StatCard from "./components/StatCard";
import StatusPieChart from "./components/StatusPieChart";
import TrendBarChart from "./components/TrendBarChart";
import WorkOrdersTable from "./components/WorkOrdersTable";

const TechnicianDashboardPage = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, inProgress: 0 });
    const [chartData, setChartData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    // State untuk pratinjau gambar
    const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
    const [previewImageUrl, setPreviewImageUrl] = useState("");

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Ganti endpoint API jika perlu
                const res = await fetch("/api/technician/work-orders");
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Gagal mengambil data Work Order");
                }
                const result = await res.json();
                const fetchedData = result.data || [];

                setWorkOrders(fetchedData);

                // Proses data yang sudah di-fetch
                const total = fetchedData.length;
                const pending = fetchedData.filter((wo) => wo.status === "pending").length;
                const completed = fetchedData.filter((wo) => wo.status === "completed").length;
                const inProgress = fetchedData.filter((wo) => wo.status === "in_progress").length;

                setStats({ total, pending, completed, inProgress });

                setChartData([
                    { name: "Pending", value: pending, color: "#ef4444" },
                    { name: "In Progress", value: inProgress, color: "#06b6d4" },
                    { name: "Completed", value: completed, color: "#10b981" }
                ]);

                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const trendData = months.map((month, index) => {
                    const monthRequests = fetchedData.filter((wo) => new Date(wo.created_at).getMonth() === index);
                    return {
                        name: month,
                        created: monthRequests.length,
                        resolved: monthRequests.filter((wo) => wo.status === "completed").length
                    };
                });

                setTrendData(trendData);
            } catch (error) {
                showToast("error", "Error", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showToast]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <ProgressSpinner />
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} />
            <h2 className="font-semibold text-2xl mb-4">Technician Dashboard</h2>

            {/* Top Stats Cards */}
            <div className="grid">
                <StatCard title="Total Work Order" value={stats.total} icon="pi-inbox" bgColor="#4f46e5" percentage={100} />
                <StatCard title="Pending Work Order" value={stats.pending} icon="pi-clock" bgColor="#ef4444" percentage={(stats.pending / stats.total) * 100} />
                <StatCard title="In Progress Work Order" value={stats.inProgress} icon="pi-spinner" bgColor="#06b6d4" percentage={(stats.inProgress / stats.total) * 100} />
                <StatCard title="Completed Work Order" value={stats.completed} icon="pi-check-circle" bgColor="#10b981" percentage={(stats.completed / stats.total) * 100} />
            </div>

            {/* Charts Section */}
            <div className="grid mt-4">
                <div className="col-12 md:col-6">
                    <StatusPieChart data={chartData} title="Work Order Status Distribution" />
                </div>
                <div className="col-12 md:col-6">
                    <TrendBarChart data={trendData} title="Monthly Work Order Trends" />
                </div>
            </div>

            {/* Recent Work Orders Table */}
            <div className="grid mt-4">
                <div className="col-12">
                    <WorkOrdersTable workOrders={workOrders} setPreviewImageUrl={setPreviewImageUrl} setImagePreviewVisible={setImagePreviewVisible} />
                </div>
            </div>

            {/* Dialog untuk pratinjau gambar */}
            <Dialog visible={imagePreviewVisible} onHide={() => setImagePreviewVisible(false)} modal header="Pratinjau Gambar" style={{ width: "50vw" }} contentStyle={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img
                    src={previewImageUrl}
                    alt="Pratinjau Isu"
                    style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/600x400/cccccc/000000?text=Image+Not+Found";
                    }}
                />
            </Dialog>
        </div>
    );
};

export default TechnicianDashboardPage;
