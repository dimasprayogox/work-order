"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast"; // Tambahkan import Toast
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// Opsi filter disesuaikan dengan nilai data asli
const statusOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
];

// Fungsi untuk memproses data mentah menjadi statistik & data chart
const processWorkOrderData = (data) => {
    const total = data.length;
    const pending = data.filter(wo => wo.status === 'pending').length;
    const completed = data.filter(wo => wo.status === 'completed').length;
    const inProgress = data.filter(wo => wo.status === 'in_progress').length;

    const stats = { total, pending, completed, inProgress };

    const chartData = [
        { name: "Pending", value: pending, color: "#ef4444" },
        { name: "In Progress", value: inProgress, color: "#06b6d4" },
        { name: "Completed", value: completed, color: "#10b981" },
    ];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trendData = months.map((month, index) => {
        const monthRequests = data.filter(wo => new Date(wo.created_at).getMonth() === index);
        return {
            name: month,
            created: monthRequests.length,
            resolved: monthRequests.filter(wo => wo.status === 'completed').length,
        };
    });

    return { stats, chartData, trendData };
};


const TechnicianDashboardPage = () => {
    const [workOrders, setWorkOrders] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, inProgress: 0 });
    const [chartData, setChartData] = useState([]);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");
    const toast = useRef(null);

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
                const { stats, chartData, trendData } = processWorkOrderData(fetchedData);
                setStats(stats);
                setChartData(chartData);
                setTrendData(trendData);

            } catch (error) {
                showToast("error", "Error", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [showToast]);

    const statusBodyTemplate = (rowData) => {
        // Kunci disesuaikan dengan nilai data asli
        const statusConfig = {
            'pending': { label: 'Pending', color: '#f97316', bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock' },
            'in_progress': { label: 'In Progress', color: '#06b6d4', bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner' },
            'completed': { label: 'Completed', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle' },
            'resolved': { label: 'Resolved', color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle' },
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
        const priority = rowData.priority || '';
        const severityMap = { 'high': 'danger', 'medium': 'warning', 'low': 'success' };
        const displayValue = priority.charAt(0).toUpperCase() + priority.slice(1);
        return <Tag value={displayValue} severity={severityMap[priority.toLowerCase()]} />;
    };

    const filteredData = workOrders.filter(wo => {
        const woStatus = wo.status || '';
        const woId = wo.id || '';
        const woDesc = wo.description || '';

        const matchesStatus = !statusFilter || woStatus === statusFilter;
        const matchesSearch = !searchText || woId.toLowerCase().includes(searchText.toLowerCase()) || woDesc.toLowerCase().includes(searchText.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><ProgressSpinner /></div>;
    }

    return (
        <div className="card">
            <Toast ref={toast} />
            <h2 className="font-semibold text-2xl mb-4">Dashboard Teknisi</h2>

            {/* Top Stats Cards */}
            <div className="grid">
                 <StatCard
                     title="Total Work Order"
                     value={stats.total}
                     icon="pi-inbox"
                     bgColor="#4f46e5" // Warna solid
                     percentage={100}
                 />
                 <StatCard
                     title="Pending"
                     value={stats.pending}
                     icon="pi-clock"
                     bgColor="#ef4444" // Warna solid
                     percentage={(stats.pending / stats.total) * 100}
                 />
                 <StatCard
                     title="In Progress"
                     value={stats.inProgress}
                     icon="pi-spinner"
                     bgColor="#06b6d4" // Warna solid
                     percentage={(stats.inProgress / stats.total) * 100}
                 />
                 <StatCard
                     title="Completed"
                     value={stats.completed}
                     icon="pi-check-circle"
                     bgColor="#10b981" // Warna solid
                     percentage={(stats.completed / stats.total) * 100}
                 />
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
                            <Column field="asset.name" header="Aset" sortable />
                            <Column header="Status" body={statusBodyTemplate} sortable sortField="status" />
                            <Column header="Prioritas" body={priorityBodyTemplate} sortable sortField="priority" />
                        </DataTable>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component untuk stat cards
 const StatCard = ({ title, value, icon, bgColor, percentage }) => (
     <div className="col-6 md:col-3">
         <div
             className="flex flex-column justify-content-between p-3 overflow-hidden h-full"
             style={{
                 borderRadius: "12px",
                 boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                 backgroundColor: bgColor // Menggunakan backgroundColor untuk satu warna solid
             }}
         >
             <div className="text-center w-full">
                 <i className={`pi ${icon} text-white opacity-80`} style={{ fontSize: "2rem" }}></i>
                 <h6 className="font-bold text-white mt-3 mb-1 uppercase text-sm">{title}</h6>
             </div>
             <h3 className="text-4xl font-bold text-white my-2 text-center">{isNaN(value) ? 0 : value}</h3>
             <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                 <div className="bg-white h-2 rounded-full" style={{ width: `${isNaN(percentage) ? 0 : percentage}%` }}></div>
             </div>
         </div>
     </div>
 );

export default TechnicianDashboardPage;
