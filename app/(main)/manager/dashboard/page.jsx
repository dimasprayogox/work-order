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
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { Chart } from 'primereact/chart';
import { classNames } from 'primereact/utils';

// Fixed status configuration with proper pending status
const statusConfig = {
    open: { label: "Pending", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-exclamation-triangle" },
    pending: { label: "Pending", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-exclamation-triangle" },
    in_progress: { label: "In Progress", color: "#3b82f6", bgColor: "bg-blue-100", textColor: "text-blue-800", icon: "pi-spinner pi-spin" },
    resolved: { label: "Completed", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check" },
    completed: { label: "Completed", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check" },
    active: { label: "Active", color: "#10b981", bgColor: "bg-green-100", textColor: "text-green-800", icon: "pi-check-circle" },
    idle: { label: "Idle", color: "#6b7280", bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-pause" },
    maintenance: { label: "Maintenance", color: "#f59e0b", bgColor: "bg-orange-100", textColor: "text-orange-800", icon: "pi-wrench" },
    broken: { label: "Broken", color: "#ef4444", bgColor: "bg-red-100", textColor: "text-red-800", icon: "pi-times-circle" }
};

const getStatusStyle = (status) => {
    return statusConfig[status] || { label: status, color: "gray", bgColor: "bg-gray-100", textColor: "text-gray-800", icon: "pi-question" };
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

const ManagerDashboardPage = () => {
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
    const [partsAnalysis, setPartsAnalysis] = useState(null);
    const [woStatusFilter, setWoStatusFilter] = useState("");
    const [woSearchText, setSearchText] = useState("");

    const woStatusOptions = [
        { label: "All Status", value: "" },
        { label: "Pending", value: "open" }, // Keep original status value
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "resolved" } // Keep original status value
    ];

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const overviewResponse = await fetch(`${API_BASE_URL}/manager/dashboard/overview`, { method: "GET", credentials: "include" });
            const overviewResult = await overviewResponse.json();
            if (!overviewResponse.ok) throw new Error(overviewResult.message || "Failed to fetch overview data.");
            setOverviewData(overviewResult.data);

            const allWoResponse = await fetch(`${API_BASE_URL}/manager/dashboard/work-orders/all`, { method: "GET", credentials: "include" });
            const allWoResult = await allWoResponse.json();
            if (!allWoResponse.ok) throw new Error(allWoResult.message || "Failed to fetch all work orders.");
            setWorkOrders(allWoResult.data || []);

            const scheduleResponse = await fetch(`${API_BASE_URL}/manager/dashboard/maintenance/schedule`, { method: "GET", credentials: "include" });
            const scheduleResult = await scheduleResponse.json();
            if (!scheduleResponse.ok) throw new Error(scheduleResult.message || "Failed to fetch maintenance schedule.");
            setMaintenanceSchedule(scheduleResult.data || []);

            const partsResponse = await fetch(`${API_BASE_URL}/manager/dashboard/parts/analysis`, { method: "GET", credentials: "include" });
            const partsResult = await partsResponse.json();
            if (!partsResponse.ok) throw new Error(partsResult.message || "Failed to fetch parts analysis data.");
            setPartsAnalysis(partsResult.data);

        } catch (error) {
            console.error("Error fetching manager dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const statusBodyTemplate = (rowData) => {
        const config = getStatusStyle(rowData.status);
        return (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    const dateBodyTemplate = (rowData, field) => {
        return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID") : "N/A";
    };

    const machineBodyTemplate = (rowData) => {
        return <Tag value={rowData.machine?.name || "N/A"} className="bg-gray-100 text-gray-800 font-medium" />;
    };

    const technicianBodyTemplate = (rowData) => {
        return <Tag value={rowData.assignedTo?.name || "Unassigned"} className="bg-blue-100 text-blue-800 font-medium" />;
    };

    const filteredWorkOrders = workOrders.filter((wo) => {
        const matchesStatus = !woStatusFilter || wo.status === woStatusFilter;
        const matchesSearch = !woSearchText || wo.title.toLowerCase().includes(woSearchText.toLowerCase()) || (wo.description && wo.description.toLowerCase().includes(woSearchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const getChartOptions = (title) => {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color') || '#374151';
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6b7280';
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#e5e7eb';

        return {
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: textColor,
                    font: { size: 16 }
                },
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder
                    }
                }
            }
        };
    };

    const totalWorkOrders = overviewData?.totalWorkOrders || 0;
    const pendingWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'open')?.count || 0;
    const inProgressWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'in_progress')?.count || 0;
    const completedWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'resolved')?.count || 0;

    const woChartData = [
        { name: "Pending", value: pendingWorkOrdersCount, color: "#ef4444" },
        { name: "In Progress", value: inProgressWorkOrdersCount, color: "#06b6d4" },
        { name: "Completed", value: completedWorkOrdersCount, color: "#10b981" }
    ].filter(item => item.value > 0);

    const machineChartData = overviewData?.machineStatus?.map(s => {
        const config = getStatusStyle(s.status);
        return { name: config.label, value: s.count, color: config.color };
    }).filter(item => item.value > 0) || [];

    return (
        <div className="card">
            <h2 className="font-semibold text-2xl mb-4">Dashboard</h2>

            {loading ? (
                <div className="flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                    <ProgressSpinner />
                    <span className="ml-2">Memuat data dashboard...</span>
                </div>
            ) : (
                <>
                    <div className="grid">
                        <div className="col-6 md:col-3">
                            <div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-briefcase text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">TOTAL WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{totalWorkOrders}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: "100%" }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 md:col-3">
                            <div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-exclamation-triangle text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">PENDING WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{pendingWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (pendingWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 md:col-3">
                            <div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-spinner text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">IN PROGRESS WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{inProgressWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (inProgressWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 md:col-3">
                            <div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-check-circle text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">COMPLETED WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{completedWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (completedWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-4">
                        <div className="col-12 md:col-6">
                            <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
                                <h5 className="font-bold mb-4 self-start">Distribusi Status Work Order</h5>
                                {woChartData.length > 0 ? (
                                    <div style={{ width: "100%", height: "350px" }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={woChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                    {woChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center w-full h-full text-gray-500">
                                        <i className="pi pi-chart-pie" style={{ fontSize: '3rem' }}></i>
                                        <p className="mt-2">No work order data available for chart.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-12 md:col-6">
                            <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "400px", flexDirection: "column", padding: "2rem" }}>
                                <h5 className="font-bold mb-4 self-start">Distribusi Status Mesin</h5>
                                {machineChartData.length > 0 ? (
                                    <div style={{ width: "100%", height: "350px" }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={machineChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                                    {machineChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center w-full h-full text-gray-500">
                                        <i className="pi pi-cog" style={{ fontSize: '3rem' }}></i>
                                        <p className="mt-2">No machine status data available for chart.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-4">
                        <div className="col-12">
                            <div className="card overflow-hidden">
                                <h5 className="font-bold mb-4">Tren Work Order Bulanan</h5>
                                {partsAnalysis?.monthlyWoTrend?.labels?.length > 0 ? (
                                    <Chart type="line" data={partsAnalysis.monthlyWoTrend} options={getChartOptions("Tren Work Order Bulanan")} className="h-20rem" />
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center w-full h-20rem text-gray-500">
                                        <i className="pi pi-chart-line" style={{ fontSize: '3rem' }}></i>
                                        <p className="mt-2">No monthly trend data available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-4">
                        <div className="col-12">
                            <div className="card overflow-hidden">
                                <h5 className="font-bold mb-4">Pemantauan Semua Work Order</h5>
                                <DataTable
                                    value={filteredWorkOrders}
                                    className="border-round-lg"
                                    rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                    paginator
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} work orders"
                                    emptyMessage="No work orders found"
                                    header={
                                        <div className="flex align-items-center justify-content-between gap-2">
                                            <div>
                                                <span className="text-xl font-bold mr-3">Work Orders</span>
                                                <Dropdown placeholder="Filter Status" value={woStatusFilter} options={woStatusOptions} onChange={(e) => setWoStatusFilter(e.value)} className="w-10rem" />
                                            </div>
                                            <InputText placeholder="Search" value={woSearchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                        </div>
                                    }
                                >
                                    <Column field="title" header="Title" sortable body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )} />
                                    <Column field="machine.name" header="Machine" body={machineBodyTemplate} sortable sortField="machine.name" />
                                    <Column field="assignedTo.name" header="Assigned Technician" body={technicianBodyTemplate} sortable sortField="assignedTo.name" />
                                    <Column field="scheduled_date" header="Scheduled Date" body={(rowData) => dateBodyTemplate(rowData, 'scheduled_date')} sortable />
                                    <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                                </DataTable>
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-4">
                        <div className="col-12">
                            <div className="card overflow-hidden">
                                <h5 className="font-bold mb-4">Jadwal Maintenance</h5>
                                <div className="w-full overflow-auto">
                                    <Calendar
                                        inline
                                        value={null}
                                        readOnlyInput
                                        style={{ width: '100%', minWidth: '300px' }}
                                        dateTemplate={(date) => {
                                            const event = maintenanceSchedule.find(
                                                (item) => {
                                                    const scheduledDate = new Date(item.scheduled_date);
                                                    return scheduledDate.getDate() === date.day &&
                                                        scheduledDate.getMonth() === date.month &&
                                                        scheduledDate.getFullYear() === date.year;
                                                }
                                            );
                                            return (
                                                <div className={classNames('relative p-1 rounded-full w-2rem h-2rem flex align-items-center justify-content-center', {
                                                    'bg-blue-500 text-white': event,
                                                    'text-gray-900': !event,
                                                    'font-bold': event,
                                                    'border-2 border-primary': date.today
                                                })}>
                                                    {date.day}
                                                    {event && (
                                                        <div className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full w-1rem h-1rem flex align-items-center justify-content-center text-xs">
                                                            <i className="pi pi-cog text-white" style={{ fontSize: '0.5rem' }}></i>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="mt-4">
                                    <h6 className="font-bold mb-2">Detail Jadwal Mendatang:</h6>
                                    {maintenanceSchedule.length > 0 ? (
                                        <ul className="list-none p-0">
                                            {maintenanceSchedule
                                                .filter(item => new Date(item.scheduled_date) >= new Date())
                                                .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))
                                                .slice(0, 5)
                                                .map((item, index) => (
                                                <li key={index} className="mb-2 p-2 bg-gray-50 rounded-md">
                                                    <div className="flex justify-content-between align-items-start">
                                                        <div>
                                                            <span className="font-medium text-blue-600">
                                                                {new Date(item.scheduled_date).toLocaleDateString('id-ID', { 
                                                                    weekday: 'short', 
                                                                    month: 'short', 
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })}:
                                                            </span>
                                                            <div className="mt-1">
                                                                <strong>{item.title}</strong> ({item.machine?.name || 'N/A'})
                                                            </div>
                                                            {item.notes && (
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    <i className="pi pi-info-circle mr-1"></i>
                                                                    {item.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Tag value={getStatusStyle(item.status).label} 
                                                             severity={item.status === 'pending' ? 'danger' : item.status === 'in_progress' ? 'info' : 'success'} />
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">Tidak ada jadwal maintenance mendatang.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid mt-4">
                        <div className="col-12 md:col-6">
                            <div className="card overflow-hidden" style={{ minHeight: "400px", padding: "2rem" }}>
                                <h5 className="font-bold mb-4">Suku Cadang Paling Sering Digunakan</h5>
                                {partsAnalysis?.mostUsedParts?.length > 0 ? (
                                    <div style={{ width: "100%", height: "350px" }}>
                                        <ResponsiveContainer>
                                            <BarChart data={partsAnalysis.mostUsedParts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" />
                                                <YAxis type="category" dataKey="partName" width={120} />
                                                <Tooltip formatter={(value, name) => [value, 'Jumlah Penggunaan']} />
                                                <Legend />
                                                <Bar dataKey="usageCount" name="Jumlah Penggunaan" fill="#8884d8" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center w-full h-full text-gray-500">
                                        <i className="pi pi-box" style={{ fontSize: '3rem' }}></i>
                                        <p className="mt-2">No parts usage data available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-12 md:col-6">
                            <div className="card overflow-hidden" style={{ minHeight: "400px", padding: "2rem" }}>
                                <h5 className="font-bold mb-4">Penggunaan Suku Cadang per Teknisi</h5>
                                {partsAnalysis?.technicianPartUsage?.length > 0 ? (
                                    <div style={{ width: "100%", height: "350px" }}>
                                        <ResponsiveContainer>
                                            <BarChart data={partsAnalysis.technicianPartUsage} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="technicianName" angle={-45} textAnchor="end" height={80} />
                                                <YAxis />
                                                <Tooltip formatter={(value, name) => [value, 'Total Suku Cadang Digunakan']} />
                                                <Legend />
                                                <Bar dataKey="totalPartsUsed" name="Total Suku Cadang Digunakan" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center w-full h-full text-gray-500">
                                        <i className="pi pi-users" style={{ fontSize: '3rem' }}></i>
                                        <p className="mt-2">No technician parts usage data available.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="card overflow-hidden">
                                <h5 className="font-bold mb-4">Laporan Ketersediaan Stok Suku Cadang Penting</h5>
                                {partsAnalysis?.criticalStock?.length > 0 ? (
                                    <DataTable
                                        value={partsAnalysis.criticalStock}
                                        className="border-round-lg"
                                        rowClassName={(rowData) => rowData.currentStock <= rowData.minStockLevel ? "bg-red-50 hover:bg-red-100 transition-colors" : "hover:bg-gray-50 transition-colors"}
                                        emptyMessage="Tidak ada suku cadang dengan stok penting."
                                        paginator
                                        rows={10}
                                        header={
                                            <div className="flex align-items-center justify-content-between">
                                                <span className="text-xl font-bold">Critical Stock Parts</span>
                                                <div className="flex align-items-center gap-2">
                                                    <i className="pi pi-exclamation-triangle text-red-500"></i>
                                                    <span className="text-sm text-gray-600">Items with low stock levels</span>
                                                </div>
                                            </div>
                                        }
                                    >
                                        <Column field="partName" header="Nama Suku Cadang" sortable body={(rowData) => (
                                            <div className="font-medium">
                                                {rowData.partName}
                                            </div>
                                        )} />
                                        <Column field="currentStock" header="Stok Saat Ini" sortable body={(rowData) => (
                                            <div className={classNames("font-bold", {
                                                "text-red-600": rowData.currentStock <= rowData.minStockLevel,
                                                "text-green-600": rowData.currentStock > rowData.minStockLevel
                                            })}>
                                                {rowData.currentStock}
                                            </div>
                                        )} />
                                        <Column field="minStockLevel" header="Level Minimum Stok" sortable />
                                        <Column header="Status" body={(rowData) => {
                                            const isLowStock = rowData.currentStock <= rowData.minStockLevel;
                                            return (
                                                <Tag 
                                                    value={isLowStock ? "Low Stock" : "Sufficient"}
                                                    severity={isLowStock ? "danger" : "success"}
                                                    icon={isLowStock ? "pi pi-exclamation-triangle" : "pi pi-check"}
                                                />
                                            );
                                        }} />
                                        <Column header="Action Required" body={(rowData) => {
                                            const isLowStock = rowData.currentStock <= rowData.minStockLevel;
                                            const deficit = rowData.minStockLevel - rowData.currentStock;
                                            return isLowStock ? (
                                                <div className="text-sm text-red-600">
                                                    <i className="pi pi-shopping-cart mr-1"></i>
                                                    Order {deficit} more units
                                                </div>
                                            ) : (
                                                <div className="text-sm text-green-600">
                                                    <i className="pi pi-check mr-1"></i>
                                                    Stock sufficient
                                                </div>
                                            );
                                        }} />
                                    </DataTable>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center p-4 text-gray-500">
                                        <i className="pi pi-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                                        <p className="mt-2 font-medium">All parts have sufficient stock levels!</p>
                                        <p className="text-sm">No critical stock alerts at this time.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default ManagerDashboardPage;
                                    