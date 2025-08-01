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

const statusConfig = {
    pending: { label: "Pending", color: "#ef4444", bgColor: "bg-red-500", textColor: "text-white", icon: "pi-exclamation-triangle" },
    in_progress: { label: "In Progress", color: "#3b82f6", bgColor: "bg-blue-500", textColor: "text-white", icon: "pi-spinner pi-spin" },
    completed: { label: "Completed", color: "#10b981", bgColor: "bg-green-500", textColor: "text-white", icon: "pi-check" },
    active: { label: "Aktif", color: "#10b981", bgColor: "bg-green-500", textColor: "text-white", icon: "pi-check-circle" },
    idle: { label: "Diam", color: "#6b7280", bgColor: "bg-gray-500", textColor: "text-white", icon: "pi-pause" },
    maintenance: { label: "Perawatan", color: "#f59e0b", bgColor: "bg-orange-500", textColor: "text-white", icon: "pi-wrench" },
    broken: { label: "Rusak", color: "#ef4444", bgColor: "bg-red-500", textColor: "text-white", icon: "pi-times-circle" }
};

const getStatusStyle = (status) => {
    return statusConfig[status] || { label: status, color: "gray", bgColor: "bg-gray-500", textColor: "text-white", icon: "pi-question" };
};

const ManagerDashboardPage = () => {
    const toast = useRef(null);
    const [loading, setLoading] = useState(true);
    const [overviewData, setOverviewData] = useState(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [maintenanceSchedules, setMaintenanceSchedules] = useState([]);
    const [partsAnalysis, setPartsAnalysis] = useState(null);
    const [woStatusFilter, setWoStatusFilter] = useState("");
    const [woSearchText, setSearchText] = useState("");

    const woStatusOptions = [
        { label: "Semua Status", value: "" },
        { label: "Pending", value: "pending" },
        { label: "In Progress", value: "in_progress" },
        { label: "Completed", value: "completed" }
    ];

    const showToast = useCallback((severity, summary, detail) => {
        toast.current?.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const overviewResponse = await fetch(`/api/manager/dashboard/overview`);
            const allWoResponse = await fetch(`/api/manager/dashboard/work-orders/all`);
            const scheduleResponse = await fetch(`/api/manager/schedules`);
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

    const statusBodyTemplate = (rowData) => {
        const config = getStatusStyle(rowData.status);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full cursor-pointer ${config.bgColor} ${config.textColor}`}
            >
                <i className={`pi ${config.icon}`}></i>
                <span className="font-medium whitespace-nowrap">{config.label}</span>
            </motion.div>
        );
    };

    const dateBodyTemplate = (rowData, field) => {
        return rowData[field] ? new Date(rowData[field]).toLocaleString("id-ID") : "N/A";
    };

    const machineBodyTemplate = (rowData) => {
        return (
            <Tag
                value={rowData.machine?.name || "N/A"}
                className="bg-gray-100 text-gray-800 font-medium border-round-lg px-2 py-1"
                style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}
            />
        );
    };
    
    const technicianBodyTemplate = (rowData) => {
        return (
            <Tag
                value={rowData.assignedTo?.full_name || "Belum Ditugaskan"}
                className="bg-blue-100 text-blue-800 font-medium border-round-lg px-2 py-1"
                style={{ backgroundColor: '#e0f2fe', color: '#1d4ed8' }}
            />
        );
    };
    
    const titleBodyTemplate = (rowData) => (
        <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
            <span className="font-medium text-blue-600 cursor-pointer">
                {rowData.title}
            </span>
        </motion.div>
    );

    const filteredWorkOrders = workOrders.filter((wo) => {
        const matchesStatus = !woStatusFilter || wo.status === woStatusFilter;
        const matchesSearch = !woSearchText || wo.title.toLowerCase().includes(woSearchText.toLowerCase()) || (wo.description && wo.description.toLowerCase().includes(woSearchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const totalWorkOrders = overviewData?.totalWorkOrders || 0;
    const pendingWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'pending')?.count || 0;
    const inProgressWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'in_progress')?.count || 0;
    const completedWorkOrdersCount = overviewData?.workOrderStatus?.find(s => s.status === 'completed')?.count || 0;

    const woChartData = [
        { name: "Pending", value: pendingWorkOrdersCount, color: "#ef4444" },
        { name: "Dalam Proses", value: inProgressWorkOrdersCount, color: "#06b6d4" },
        { name: "Selesai", value: completedWorkOrdersCount, color: "#10b981" }
    ].filter(item => item.value > 0);

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
                                    className="p-datatable-gridlines p-datatable-striped"
                                    rowClassName={() => "hover:bg-gray-50 transition-colors cursor-pointer"}
                                    paginator
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25, 50]}
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                                    currentPageReportTemplate="Menampilkan {first} sampai {last} dari {totalRecords} work order"
                                    emptyMessage="Tidak ada work order ditemukan"
                                    header={
                                        <div className="flex justify-content-between align-items-center p-4">
                                            <div className="flex align-items-center gap-2">
                                                <span className="font-semibold text-lg">Work Orders</span>
                                                <Dropdown
                                                    placeholder="Semua Status"
                                                    value={woStatusFilter}
                                                    options={woStatusOptions}
                                                    onChange={(e) => setWoStatusFilter(e.value)}
                                                    className="w-full md:w-12rem"
                                                />
                                            </div>
                                            <span className="p-input-icon-left">
                                                <i className="pi pi-search" />
                                                <InputText
                                                    placeholder="Cari"
                                                    value={woSearchText}
                                                    onChange={(e) => setSearchText(e.target.value)}
                                                    className="w-full md:w-15rem"
                                                />
                                            </span>
                                        </div>
                                    }
                                >
                                    <Column
                                        field="title"
                                        header="Judul"
                                        sortable
                                        body={titleBodyTemplate}
                                    />
                                    <Column
                                        field="machine.name"
                                        header="Mesin"
                                        body={machineBodyTemplate}
                                        sortable
                                        sortField="machine.name"
                                    />
                                    <Column
                                        field="assignedTo.full_name"
                                        header="Teknisi Ditugaskan"
                                        body={technicianBodyTemplate}
                                        sortable
                                        sortField="assignedTo.full_name"
                                    />
                                    <Column
                                        field="scheduled_date"
                                        header="Tanggal Terjadwal"
                                        body={(rowData) => dateBodyTemplate(rowData, 'scheduled_date')}
                                        sortable
                                    />
                                    <Column
                                        field="status"
                                        header="Status"
                                        body={statusBodyTemplate}
                                        sortable
                                    />
                                </DataTable>
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

export default ManagerDashboardPage;