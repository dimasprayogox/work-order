/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const TechnicianDashboardPage = () => {
    const [assignedWorkOrders, setAssignedWorkOrders] = useState([]);
    const [completedWorkOrdersCount, setCompletedWorkOrdersCount] = useState(0);
    const [avgRepairTime, setAvgRepairTime] = useState("0H");

    useEffect(() => {
        // Simulasi pengambilan data dari API
        const fetchData = setTimeout(() => {
            setAssignedWorkOrders([
                { id: "WO-001", description: "Perbaikan AC Ruang Server", status: "In Progress", priority: "High", asset: "AC-SRV-01" },
                { id: "WO-002", description: "Cek rutin Genset", status: "Pending", priority: "Medium", asset: "GEN-001" },
                { id: "WO-003", description: "Ganti lampu koridor", status: "Open", priority: "Low", asset: "LMP-KOR-03" },
            ]);
            setCompletedWorkOrdersCount(15); // Misalnya, dalam sebulan terakhir
            setAvgRepairTime("3.5H");
        }, 3000);

        return () => clearTimeout(fetchData);
    }, []);

    const statusBodyTemplate = (rowData) => { // Removed ': any' type annotation
        const getSeverity = (status) => { // Removed ': string' type annotation
            switch (status) {
                case 'In Progress':
                    return 'info';
                case 'Pending':
                    return 'warning';
                case 'High':
                    return 'danger';
                case 'Medium':
                    return 'warning';
                case 'Low':
                    return 'success';
                case 'Open': // Tambahkan status 'Open' untuk work order baru
                    return 'info';
                default:
                    return null;
            }
        };
        return <Tag value={rowData.status || rowData.priority} severity={getSeverity(rowData.status || rowData.priority)} />;
    };

    return (
        <>
            <div className="card">
                <h2 className="font-semibold">Dashboard Teknisi</h2>
                <div className="grid">
                    <div className="col-12 md:col-6 lg:col-4">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">WORK ORDER SELESAI</h6>
                                <p>Bulan Ini</p>
                            </div>
                            <h3>{completedWorkOrdersCount}</h3>
                        </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-4">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">RATA-RATA WAKTU PERBAIKAN (MTTR)</h6>
                                <p>Semua Work Order</p>
                            </div>
                            <h3>{avgRepairTime}</h3>
                        </div>
                    </div>
                    <div className="col-12 lg:col-12">
                        <Panel header="WORK ORDER DITUGASKAN">
                            <DataTable value={assignedWorkOrders} paginator rows={5} dataKey="id" emptyMessage="Tidak ada work order yang ditugaskan.">
                                <Column field="id" header="ID"></Column>
                                <Column field="description" header="Deskripsi"></Column>
                                <Column field="asset" header="Aset"></Column>
                                <Column field="status" header="Status" body={statusBodyTemplate}></Column>
                                <Column field="priority" header="Prioritas" body={statusBodyTemplate}></Column>
                                {/* Kolom untuk aksi seperti "Lihat Detail" atau "Update Status" bisa ditambahkan di sini */}
                            </DataTable>
                        </Panel>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TechnicianDashboardPage;
