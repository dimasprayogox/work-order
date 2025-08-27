"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";

// Import components
import StatusCards from "./components/StatusCards";
import ChartsSection from "./components/ChartsSection";
import WorkOrdersTable from "./components/WorkOrdersTable";
import MaintenanceSchedule from "./components/MaintenanceSchedule";

// Status configuration
const statusConfig = {
    pending: { label: "Pending", color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-700", icon: "pi-exclamation-triangle" },
    in_progress: { label: "Dalam Proses", color: "#3b82f6", bgColor: "bg-blue-50", textColor: "text-blue-700", icon: "pi-spinner pi-spin" },
    completed: { label: "Selesai", color: "#10b981", bgColor: "bg-green-50", textColor: "text-green-700", icon: "pi-check" },
    maintenance: { label: "Maintenance", color: "#f59e0b", bgColor: "bg-orange-50", textColor: "text-orange-700", icon: "pi-wrench" },
    operational: { label: "Operasional", color: "#3b82f6", bgColor: "bg-blue-50", textColor: "text-blue-700", icon: "pi-cog" },
    down: { label: "Down", color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-700", icon: "pi-times-circle" }
};

const getStatusStyle = (status) => {
    return statusConfig[status] || { label: status, color: "gray", bgColor: "bg-gray-50", textColor: "text-gray-700", icon: "pi-question" };
};

const DashboardPage = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
    const [machines, setMachines] = useState([]); // ⬅️ tambah state
    const [assets, setAssets] = useState([]); // ⬅️ tambah state
    const [technicians, setTechnicians] = useState([]); // ⬅️ tambah state

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchMachines = useCallback(async () => {
        try {
            const res = await fetch("/api/manager/machines", { credentials: "include" });
            const body = await res.json();
            setMachines(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data mesin");
        }
    }, [showToast]);

    const fetchAssets = useCallback(async () => {
        try {
            const res = await fetch("/api/manager/assets", { credentials: "include" });
            const body = await res.json();
            setAssets(body.data || []);
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data aset");
        }
    }, [showToast]);

    const fetchTechnicians = useCallback(async () => {
        try {
            const res = await fetch("/api/manager/work-orders/technicians", {
                credentials: "include"
            });
            const body = await res.json();

            if (res.ok) {
                setTechnicians(body.data || []);
            }
        } catch (err) {
            showToast("error", "Error", "Gagal mengambil data teknisi");
        }
    }, [showToast]);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [overviewResponse, allWoResponse, scheduleResponse] = await Promise.all([
                fetch(`/api/manager/dashboard/overview`).then((res) => res.json()),
                fetch(`/api/manager/work-orders`).then((res) => res.json()),
                fetch(`/api/manager/schedules`).then((res) => res.json())
            ]);

            if (overviewResponse.success) setOverviewData(overviewResponse.data);
            if (allWoResponse.success) setWorkOrders(allWoResponse.data || []);
            if (scheduleResponse.success) setMaintenanceSchedules(scheduleResponse.data || []);
        } catch (error) {
            console.error("Error fetching manager dashboard data:", error);
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDashboardData();
        fetchMachines();
        fetchAssets();
        fetchTechnicians();
    }, [fetchDashboardData, fetchMachines, fetchAssets, fetchTechnicians]);

    if (loading) {
        return (
            <div className="card">
                <Toast ref={toast} position="top-right" />
                <h2 className="font-semibold text-2xl mb-4">Dashboard</h2>
                <div className="flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
                    <ProgressSpinner />
                    <span className="ml-2">Memuat data dashboard...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <Toast ref={toast} position="top-right" />
            <h2 className="font-semibold text-2xl mb-4">Dashboard</h2>

            <StatusCards workOrders={workOrders} />

            <ChartsSection
                overviewData={overviewData}
                getStatusStyle={getStatusStyle}
                machines={machines} // ⬅️ kirim data mesin
                assets={assets} // ⬅️ kirim data aset
            />

            <MaintenanceSchedule workOrders={workOrders} maintenanceSchedules={maintenanceSchedules} getStatusStyle={getStatusStyle} />

            <WorkOrdersTable
                workOrders={workOrders}
                getStatusStyle={getStatusStyle}
                machines={machines} // ⬅️ kirim data mesin
                assets={assets} // ⬅️ kirim data aset
                technicians={technicians}
            />
        </div>
    );
};

export default DashboardPage;