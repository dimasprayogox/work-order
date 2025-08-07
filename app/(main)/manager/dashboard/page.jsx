"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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
import { Toast } from "primereact/toast";

// Configuration for different status types
const statusConfig = {
    pending: { label: "Pending", color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-700", icon: "pi-exclamation-triangle" },
    in_progress: { label: "Dalam Proses", color: "#3b82f6", bgColor: "bg-blue-50", textColor: "text-blue-700", icon: "pi-spinner pi-spin" },
    completed: { label: "Selesai", color: "#10b981", bgColor: "bg-green-50", textColor: "text-green-700", icon: "pi-check" },
    active: { label: "Aktif", color: "#10b981", bgColor: "bg-green-50", textColor: "text-green-700", icon: "pi-check-circle" },
    idle: { label: "Diam", color: "#6b7280", bgColor: "bg-gray-50", textColor: "text-gray-700", icon: "pi-pause" },
    maintenance: { label: "Perawatan", color: "#f59e0b", bgColor: "bg-orange-50", textColor: "text-orange-700", icon: "pi-wrench" },
    broken: { label: "Rusak", color: "#ef4444", bgColor: "bg-red-50", textColor: "text-red-700", icon: "pi-times-circle" }
};

// Helper function to get status styles
const getStatusStyle = (status) => {
    return statusConfig[status] || { label: status, color: "gray", bgColor: "bg-gray-50", textColor: "text-gray-700", icon: "pi-question" };
};

const App = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
    const [partsAnalysis, setPartsAnalysis] = useState(null);
    const [woStatusFilter, setWoStatusFilter] = useState("");
    const [woSearchText, setSearchText] = useState("");

    // Dropdown options for work order status filter
    const woStatusOptions = [
        { label: "Semua Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "Dalam Proses", value: "in_progress" },
        { label: "Selesai", value: "completed" }
    ];

    // Function to show toast notifications
    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    // Function to fetch all dashboard data from API endpoints
    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            // Using Next.js API proxy routes
            const overviewResponse = await fetch(`/api/manager/dashboard/overview`);
            const allWoResponse = await fetch(`/api/manager/dashboard/work-orders/all`);
            const scheduleResponse = await fetch(`/api/manager/schedules`);
            // Fetch parts analysis from the consolidated proxy route
            const partsResponse = await fetch(`/api/manager/dashboard/parts/analysis`);

            const [overviewResult, allWoResult, scheduleResult, partsResult] = await Promise.all([
                overviewResponse.json(),
                allWoResponse.json(),
                scheduleResponse.json(),
                partsResponse.json()
            ]);

            if (!overviewResponse.ok) throw new Error(overviewResult.message || "Gagal mengambil data ringkasan.");
            setOverviewData(overviewResult.data);

            if (!allWoResponse.ok) throw new Error(allWoResult.message || "Gagal mengambil semua work order.");
            setWorkOrders(allWoResult.data || []);

            if (!scheduleResponse.ok) throw new Error(scheduleResult.message || "Gagal mengambil jadwal perawatan.");
            setMaintenanceSchedules(scheduleResult.data || []);

            if (!partsResponse.ok) throw new Error(partsResult.message || "Gagal mengambil data analisis suku cadang.");
            setPartsAnalysis(partsResult.data);

        } catch (error) {
            console.error("Error fetching manager dashboard data:", error);
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    // Memoized list of all scheduled events (work orders and maintenance) for the calendar
    const allScheduledEvents = useMemo(() => {
        const events = [];

        workOrders.forEach(wo => {
            if (wo.scheduled_date) {
                events.push({
                    date: new Date(wo.scheduled_date),
                    type: 'workOrder',
                    title: wo.title,
                    description: wo.description,
                    machineName: wo.machine?.name,
                    status: wo.status,
                    priority: wo.priority,
                    assignedTo: wo.assignedTo?.full_name
                });
            }
        });

        maintenanceSchedules.forEach(sch => {
            if (sch.next_due_date) {
                events.push({
                    date: new Date(sch.next_due_date),
                    type: 'maintenanceSchedule',
                    title: sch.title,
                    description: sch.description,
                    machineName: sch.machine?.name,
                    frequency: sch.frequency
                });
            }
        });

        events.sort((a, b) => a.date.getTime() - b.date.getTime());
        return events;
    }, [workOrders, maintenanceSchedules]);

    // Custom template for displaying status in DataTable, with motion animations and custom styling
    const statusBodyTemplate = (rowData) => {
        const config = getStatusStyle(rowData.status);
        
        const customStyle = {
            backgroundColor: config.color,
            color: 'white',
            borderRadius: '0.5rem',
            padding: '0.25rem 0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
        };

        return (
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05 }}
            >
                <div style={customStyle}>
                    <i className={`pi ${config.icon}`}></i>
                    <span className="font-medium">{config.label}</span>
                </div>
            </motion.div>
        );
    };

    // Template for formatting dates in the DataTable
    const dateBodyTemplate = (rowData, field) => {
        return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID") : "N/A";
    };

    // Template for machine name tag
    const machineBodyTemplate = (rowData) => {
        return <Tag value={rowData.machine?.name || "N/A"} className="bg-gray-100 text-gray-800 font-medium" />;
    };

    // Template for technician name tag
    const technicianBodyTemplate = (rowData) => {
        return <Tag value={rowData.assignedTo?.full_name || "Belum Ditugaskan"} className="bg-blue-100 text-blue-800 font-medium" />;
    };

    // Filtered work orders based on search text and status filter
    const filteredWorkOrders = workOrders.filter((wo) => {
        const matchesStatus = !woStatusFilter || wo.status === woStatusFilter;
        const matchesSearch = !woSearchText || wo.title.toLowerCase().includes(woSearchText.toLowerCase()) || (wo.description && wo.description.toLowerCase().includes(woSearchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    // Overview data counts
    const totalWorkOrders = overviewData?.totalWorkOrders || 0;
    const pendingWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'pending')?.count || 0;
    const inProgressWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'in_progress')?.count || 0;
    const completedWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'completed')?.count || 0;

    // Data for work order status pie chart
    const woChartData = [
        { name: "Pending", value: pendingWorkOrdersCount, color: "#ef4444" },
        { name: "Dalam Proses", value: inProgressWorkOrdersCount, color: "#3b82f6" },
        { name: "Selesai", value: completedWorkOrdersCount, color: "#10b981" }
    ].filter(item => item.value > 0);

    // Data for machine status pie chart
    const machineChartData = overviewData?.machineStatus?.map(s => {
        const config = getStatusStyle(s.status);
        return { name: config.label, value: s.count, color: config.color };
    }).filter(item => item.value > 0) || [];

    return (
        <div className="card">
            <Toast ref={toast} position="top-right" />
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
                            <motion.div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-briefcase text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">TOTAL WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{totalWorkOrders}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: "100%" }}></div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="col-6 md:col-3">
                            <motion.div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-exclamation-triangle text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">PENDING WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{pendingWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (pendingWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="col-6 md:col-3">
                            <motion.div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-spinner text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">IN PROGRESS WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{inProgressWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (inProgressWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="col-6 md:col-3">
                            <motion.div className="card flex flex-column align-items-center justify-content-between p-3 overflow-hidden" style={{ height: "180px", background: "linear-gradient(135deg, #10b981 0%, #22c55e 100%)", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }} whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>
                                <div className="text-center w-full">
                                    <i className="pi pi-check-circle text-white opacity-80" style={{ fontSize: "2rem" }}></i>
                                    <h6 className="font-bold text-white mt-3 mb-1">COMPLETED WORK ORDERS</h6>
                                </div>
                                <h3 className="text-4xl font-bold text-white my-2">{completedWorkOrdersCount}</h3>
                                <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                                    <div className="bg-white h-2 rounded-full" style={{ width: `${totalWorkOrders > 0 ? (completedWorkOrdersCount / totalWorkOrders) * 100 : 0}%` }}></div>
                                </div>
                            </motion.div>
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
                                        <p className="mt-2">Tidak ada data work order untuk grafik.</p>
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
                                        <p className="mt-2">Tidak ada data status mesin untuk grafik.</p>
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
                                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} work order"
                                    emptyMessage="Tidak ada work order ditemukan"
                                    header={
                                        <div className="flex align-items-center justify-content-between gap-2">
                                            <div>
                                                <span className="text-xl font-bold mr-3">Work Orders</span>
                                                <Dropdown placeholder="Filter Status" value={woStatusFilter} options={woStatusOptions} onChange={(e) => setWoStatusFilter(e.value)} className="w-10rem" />
                                            </div>
                                            <InputText placeholder="Cari" value={woSearchText} onChange={(e) => setSearchText(e.target.value)} className="w-15rem" />
                                        </div>
                                    }
                                >
                                    <Column field="title" header="Judul" sortable body={(rowData) => (
                                        <motion.div whileHover={{ x: 5 }} className="font-medium text-blue-600">
                                            {rowData.title}
                                        </motion.div>
                                    )} />
                                    <Column field="machine.name" header="Mesin" body={machineBodyTemplate} sortable sortField="machine.name" />
                                    <Column field="assignedTo.full_name" header="Teknisi Ditugaskan" body={technicianBodyTemplate} sortable sortField="assignedTo.full_name" />
                                    <Column field="scheduled_date" header="Tanggal Terjadwal" body={(rowData) => dateBodyTemplate(rowData, 'scheduled_date')} sortable />
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
                                            const eventsOnThisDay = allScheduledEvents.filter(
                                                (event) =>
                                                    event.date.getDate() === date.day &&
                                                    event.date.getMonth() === date.month &&
                                                    event.date.getFullYear() === date.year
                                            );
                                            const hasEvent = eventsOnThisDay.length > 0;
                                            const hasWorkOrder = eventsOnThisDay.some(e => e.type === 'workOrder');
                                            const hasMaintenance = eventsOnThisDay.some(e => e.type === 'maintenanceSchedule');

                                            let icon = null;
                                            if (hasWorkOrder && hasMaintenance) {
                                                icon = <i className="pi pi-calendar-times text-white" style={{ fontSize: '0.5rem' }}></i>; // Both
                                            } else if (hasWorkOrder) {
                                                icon = <i className="pi pi-briefcase text-white" style={{ fontSize: '0.5rem' }}></i>; // Work Order
                                            } else if (hasMaintenance) {
                                                icon = <i className="pi pi-cog text-white" style={{ fontSize: '0.5rem' }}></i>; // Maintenance Schedule
                                            }

                                            return (
                                                <div className={classNames('relative p-1 rounded-full w-2rem h-2rem flex align-items-center justify-content-center', {
                                                    'bg-blue-500 text-white': hasEvent, // Base color if there is an event
                                                    'text-gray-900': !hasEvent,
                                                    'font-bold': hasEvent,
                                                    'border-2 border-primary': date.today
                                                })}>
                                                    {date.day}
                                                    {hasEvent && (
                                                        <motion.div 
                                                            className="absolute -bottom-1 -right-1 bg-orange-500 rounded-full w-1rem h-1rem flex align-items-center justify-content-center text-xs"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                                        >
                                                            {icon}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="mt-4">
                                    <h6 className="font-bold mb-2">Detail Jadwal Mendatang:</h6>
                                    {allScheduledEvents.length > 0 ? (
                                        <ul className="list-none p-0">
                                            {allScheduledEvents
                                                .filter(event => event.date >= new Date()) // Only future events
                                                .slice(0, 5) // Limit to 5 events
                                                .map((event, index) => (
                                                    <motion.li 
                                                        key={index} 
                                                        className="mb-2 p-2 bg-gray-50 rounded-md"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                                    >
                                                        <div className="flex justify-content-between align-items-start">
                                                            <div>
                                                                <span className="font-medium text-blue-600">
                                                                    {event.date.toLocaleDateString('id-ID', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}:
                                                                </span>
                                                                <div className="mt-1">
                                                                    <strong>{event.title}</strong> ({event.machineName || 'N/A'})
                                                                    {event.type === 'workOrder' && (
                                                                        <span className="ml-2 text-sm text-gray-500">
                                                                            (WO - {getStatusStyle(event.status).label})
                                                                        </span>
                                                                    )}
                                                                    {event.type === 'maintenanceSchedule' && (
                                                                        <span className="ml-2 text-sm text-gray-500">
                                                                            (Jadwal PM)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(event.description || event.notes) && (
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        <i className="pi pi-info-circle mr-1"></i>
                                                                        {event.description || event.notes}
                                                                    </div>
                                                                )}
                                                                {event.type === 'workOrder' && event.assignedTo && (
                                                                    <div className="text-sm text-gray-600 mt-1">
                                                                        <i className="pi pi-user mr-1"></i>
                                                                        Teknisi: {event.assignedTo}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.li>
                                                ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500">Tidak ada jadwal maintenance atau work order mendatang.</p>
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
                                        <p className="mt-2">Tidak ada data penggunaan suku cadang.</p>
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
                                        <p className="mt-2">Tidak ada data penggunaan suku cadang per teknisi.</p>
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
                                                <span className="text-xl font-bold">Suku Cadang Stok Kritis</span>
                                                <div className="flex align-items-center gap-2">
                                                    <i className="pi pi-exclamation-triangle text-red-500"></i>
                                                    <span className="text-sm text-gray-600">Item dengan level stok rendah</span>
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
                                                    value={isLowStock ? "Stok Rendah" : "Cukup"}
                                                    severity={isLowStock ? "danger" : "success"}
                                                    icon={isLowStock ? "pi pi-exclamation-triangle" : "pi pi-check"}
                                                />
                                            );
                                        }} />
                                        <Column header="Tindakan Diperlukan" body={(rowData) => {
                                            const isLowStock = rowData.currentStock <= rowData.minStockLevel;
                                            const deficit = rowData.minStockLevel - rowData.currentStock;
                                            return isLowStock ? (
                                                <div className="text-sm text-red-600">
                                                    <i className="pi pi-shopping-cart mr-1"></i>
                                                    Pesan {deficit} unit lagi
                                                </div>
                                            ) : (
                                                <div className="text-sm text-green-600">
                                                    <i className="pi pi-check mr-1"></i>
                                                    Stok cukup
                                                </div>
                                            );
                                        }} />
                                    </DataTable>
                                ) : (
                                    <div className="flex flex-column align-items-center justify-content-center p-4 text-gray-500">
                                        <i className="pi pi-check-circle" style={{ fontSize: '3rem', color: '#10b981' }}></i>
                                        <p className="mt-2 font-medium">Semua suku cadang memiliki level stok yang cukup!</p>
                                        <p className="text-sm">Tidak ada peringatan stok kritis saat ini.</p>
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

export default App;
