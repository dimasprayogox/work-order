/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "In Progress", value: "In Progress" },
    { label: "Pending", value: "Pending" },
    { label: "Completed", value: "Completed" },
];

const TechnicianDashboardPage = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, inProgress: 0 });
    const [chartData, setChartData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");

    useEffect(() => {
        const fetchData = setTimeout(() => {
            const mockWorkOrders = [
                { id: "WO-001", description: "Perbaikan AC Ruang Server", status: "In Progress", priority: "High", asset: "AC-SRV-01", created_at: "2025-07-20T10:00:00Z" },
                { id: "WO-002", description: "Cek rutin Genset", status: "Pending", priority: "Medium", asset: "GEN-001", created_at: "2025-07-18T14:30:00Z" },
                { id: "WO-003", description: "Ganti lampu koridor", status: "Open", priority: "Low", asset: "LMP-KOR-03", created_at: "2025-06-25T09:00:00Z" },
                { id: "WO-004", description: "Perbaikan Pintu Otomatis", status: "Completed", priority: "High", asset: "DOOR-LOBBY-01", created_at: "2025-06-15T11:00:00Z" },
                { id: "WO-005", description: "Inspeksi Sistem Pemadam", status: "Open", priority: "Medium", asset: "FIRE-SYS-01", created_at: "2025-05-30T16:00:00Z" },
                { id: "WO-006", description: "Kalibrasi sensor suhu", status: "Completed", priority: "Medium", asset: "SENSOR-04", created_at: "2025-05-10T13:20:00Z" },
                { id: "WO-007", description: "Pembersihan filter air", status: "In Progress", priority: "Low", asset: "WATER-FLT-02", created_at: "2025-04-22T08:45:00Z" },
            ];
            setWorkOrders(mockWorkOrders);

            // Calculate stats
            const total = mockWorkOrders.length;
            const pending = mockWorkOrders.filter(wo => wo.status === 'Pending' || wo.status === 'Open').length;
            const completed = mockWorkOrders.filter(wo => wo.status === 'Completed').length;
            const inProgress = mockWorkOrders.filter(wo => wo.status === 'In Progress').length;
            setStats({ total, pending, completed, inProgress });

            // Prepare chart data
            setChartData([
                { name: "Pending/Open", value: pending, color: "#ef4444" },
                { name: "In Progress", value: inProgress, color: "#06b6d4" },
                { name: "Completed", value: completed, color: "#10b981" },
            ]);

            // Prepare trend data
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const trend = months.map((month, index) => {
                const monthRequests = mockWorkOrders.filter(wo => new Date(wo.created_at).getMonth() === index);
                return {
                    name: month,
                    created: monthRequests.length,
                    resolved: monthRequests.filter(wo => wo.status === 'Completed').length,
                };
            });
            setTrendData(trend);

            setLoading(false);
        }, 2000);

        return () => clearTimeout(fetchData);
    }, []);

    const statusBodyTemplate = (rowData) => {
        const statusConfig = {
            'Open': { label: 'Open', color: '#3b82f6', bgColor: 'bg-blue-100', textColor: 'text-blue-800', icon: 'pi-folder-open' },
            'Pending': { label: 'Pending', color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock' },
            'In Progress': { label: 'In Progress', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner' },
            'Completed': { label: 'Completed', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle' },
        };
        const config = statusConfig[rowData.status] || { label: rowData.status, bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question' };
        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const priorityBodyTemplate = (rowData) => {
        const severityMap = { 'High': 'danger', 'Medium': 'warning', 'Low': 'success' };
        return <Tag value={rowData.priority} severity={severityMap[rowData.priority]} />;
    };

    const filteredData = workOrders.filter(wo => {
        const matchesStatus = !statusFilter || wo.status === statusFilter;
        const matchesSearch = !searchText || wo.id.toLowerCase().includes(searchText.toLowerCase()) || wo.description.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><ProgressSpinner /></div>;
    }

    return (
        <div className="card">
            <h2 className="font-semibold text-2xl mb-4">Dashboard Teknisi</h2>

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
                            <h6 className="font-bold text-white mt-3 mb-1">TOTAL WORK ORDER</h6>
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
                        <h3 className="text-4xl font-bold text-white my-2">{stats.completed}</h3>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                            <div className="bg-white h-2 rounded-full" style={{ width: `${(stats.completed / stats.total) * 100}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Charts Section */}
            <div className="grid mt-4">
                <div className="col-12 md:col-6">
                    <div className="card flex flex-column align-items-center justify-content-center overflow-hidden p-4" style={{ minHeight: "400px" }}>
                        <h5 className="font-bold mb-4 self-start">Distribusi Status Work Order</h5>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="col-12 md:col-6">
                     <div className="card flex flex-column align-items-center justify-content-center overflow-hidden p-4" style={{ minHeight: "400px" }}>
                        <h5 className="font-bold mb-4 self-start">Tren Work Order Bulanan</h5>
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="created" name="Dibuat" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="resolved" name="Selesai" fill="#22C55E" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Work Orders Table */}
            <div className="grid mt-4">
                <div className="col-12">
                    <div className="card overflow-hidden">
                        <DataTable
                            value={filteredData}
                            paginator rows={5} dataKey="id"
                            emptyMessage="Tidak ada work order ditemukan."
                            className="border-round-lg"
                            rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                            header={
                                <div className="flex align-items-center justify-content-between gap-2">
                                    <h5 className="font-bold m-0">Work Order Ditugaskan</h5>
                                    <div className="flex gap-2">
                                        <Dropdown placeholder="Filter Status" value={statusFilter} options={statusOptions} onChange={(e) => setStatusFilter(e.value)} className="w-12rem" showClear />
                                        <span className="p-input-icon-left">
                                            <i className="pi pi-search" />
                                            <InputText placeholder="Cari ID atau Deskripsi" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                        </span>
                                    </div>
                                </div>
                            }
                        >
                            <Column field="id" header="ID" sortable />
                            <Column field="description" header="Deskripsi" sortable />
                            <Column field="asset" header="Aset" sortable />
                            <Column header="Status" body={statusBodyTemplate} sortable sortField="status" />
                            <Column header="Prioritas" body={priorityBodyTemplate} sortable sortField="priority" />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for stat cards
const StatCard = ({ title, value, icon, gradient, percentage }) => (
    <div className="col-6 md:col-3">
        <div className={`flex flex-column justify-content-between p-3 overflow-hidden h-full bg-gradient-to-r ${gradient}`} style={{ borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
            <div className="text-center w-full">
                <i className={`pi ${icon} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                <h6 className="font-bold text-white mt-3 mb-1 uppercase text-sm">{title}</h6>
            </div>
            <h3 className="text-4xl font-bold text-white my-2 text-center">{value}</h3>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                <div className="bg-white h-2 rounded-full" style={{ width: `${percentage || 0}%` }}></div>
            </div>
        </div>
    </div>
);

export default TechnicianDashboardPage;
