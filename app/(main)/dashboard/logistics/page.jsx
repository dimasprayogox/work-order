/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { Panel } from "primereact/panel";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

const LogisticsDashboardPage = () => { // Nama komponen diubah
    const [lowStockItems, setLowStockItems] = useState([]);
    const [newPartRequests, setNewPartRequests] = useState(0);
    const [incomingShipments, setIncomingShipments] = useState([]);

    useEffect(() => {
        // Simulasi pengambilan data
        const fetchData = setTimeout(() => {
            setLowStockItems([
                { id: "PART-001", name: "Filter Oli", currentStock: 5, minStock: 10 },
                { id: "PART-005", name: "Sensor Suhu", currentStock: 2, minStock: 5 },
            ]);
            setNewPartRequests(7);
            setIncomingShipments([
                { id: "SHIP-001", supplier: "PT Mekar Jaya", eta: "2025-07-20", status: "In Transit" },
                { id: "SHIP-002", supplier: "CV Maju Bersama", eta: "2025-07-22", status: "Pending Pickup" },
            ]);
        }, 3000);

        return () => clearTimeout(fetchData);
    }, []);

    const stockStatusBodyTemplate = (rowData) => { // Removed ': any' type annotation
        const severity = rowData.currentStock < rowData.minStock ? 'danger' : 'success';
        return <Tag value={`${rowData.currentStock} / ${rowData.minStock}`} severity={severity} />;
    };

    const shipmentStatusBodyTemplate = (rowData) => { // Removed ': any' type annotation
        const getSeverity = (status) => { // Removed ': string' type annotation
            switch (status) {
                case 'In Transit':
                    return 'info';
                case 'Pending Pickup':
                    return 'warning';
                case 'Delivered':
                    return 'success';
                default:
                    return null;
            }
        };
        return <Tag value={rowData.status} severity={getSeverity(rowData.status)} />;
    };

    return (
        <>
            <div className="card">
                <h2 className="font-semibold">Dashboard Logistik</h2>
                <div className="grid">
                    <div className="col-12 md:col-6 lg:col-4">
                        <div className="card flex align-items-center justify-content-center overflow-hidden" style={{ minHeight: "200px", flexDirection: "column" }}>
                            <div className="text-center mb-3">
                                <h6 className="font-bold">PERMINTAAN SUKU CADANG BARU</h6>
                                <p>Menunggu Persetujuan</p>
                            </div>
                            <h3 className="text-orange-500">{newPartRequests}</h3>
                        </div>
                    </div>
                    <div className="col-12 lg:col-8">
                        <Panel header="ITEM STOK RENDAH">
                            <DataTable value={lowStockItems} paginator rows={3} dataKey="id" emptyMessage="Tidak ada item stok rendah.">
                                <Column field="id" header="ID Item"></Column>
                                <Column field="name" header="Nama Item"></Column>
                                <Column field="currentStock" header="Stok Saat Ini"></Column>
                                <Column field="minStock" header="Stok Minimum"></Column>
                                <Column header="Status" body={stockStatusBodyTemplate}></Column>
                            </DataTable>
                        </Panel>
                    </div>
                    <div className="col-12">
                        <Panel header="PENGIRIMAN MASUK">
                            <DataTable value={incomingShipments} paginator rows={5} dataKey="id" emptyMessage="Tidak ada pengiriman masuk.">
                                <Column field="id" header="ID Pengiriman"></Column>
                                <Column field="supplier" header="Pemasok"></Column>
                                <Column field="eta" header="ETA"></Column>
                                <Column field="status" header="Status" body={shipmentStatusBodyTemplate}></Column>
                            </DataTable>
                        </Panel>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LogisticsDashboardPage;
