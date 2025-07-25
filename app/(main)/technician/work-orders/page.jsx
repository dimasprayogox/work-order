"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Divider } from "primereact/divider";
import { Image } from "primereact/image"; // Impor komponen Image
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import UpdateWorkOrderDialog from "./components/UpdateWorkOrderDialog";

// Opsi untuk filter status
const statusFilterOptions = [
    { label: "All Statuses", value: "" },
    { label: "Pending", value: "open" },
    { label: "In Progress", value: "in_progress" },
    { label: "Resolved", value: "resolved" },
    { label: "Completed", value: "completed" },
];

// Template untuk menampilkan status dengan warna dan teks yang benar
const statusBodyTemplate = (rowData) => {
    const statusMap = {
        open: { label: "Pending", severity: "danger" },
        in_progress: { label: "In Progress", severity: "info" },
        resolved: { label: "Resolved", severity: "success" },
        completed: { label: "Completed", severity: "success" },
    };
    const statusInfo = statusMap[rowData.status] || { label: rowData.status, severity: "warning" };
    return <Tag value={statusInfo.label} severity={statusInfo.severity} />;
};

// Template untuk menampilkan tanggal dengan format yang mudah dibaca
const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

// Template untuk menampilkan foto
const photoBodyTemplate = (rowData) => {
    // Gunakan optional chaining (?) untuk mengakses properti secara aman
    const photoUrl = rowData.issue?.photo_url;

    if (photoUrl) {
        return (
            <Image
                src={photoUrl}
                alt="Issue Photo"
                width="60"
                height="60"
                preview // Memungkinkan gambar diperbesar saat diklik
                imageClassName="rounded-md object-cover"
            />
        );
    }
    // Tampilkan placeholder jika tidak ada foto
    return <div className="flex items-center justify-center h-[60px] w-[60px] bg-gray-100 rounded-md text-gray-400 text-xs">No Photo</div>;
};


export default function TechnicianWorkOrderPage() {
    const [workOrders, setWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);
    const router = useRouter();

    // State untuk dialog, filter, dan item terpilih
    const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    }, []);

    // Fungsi untuk mengambil data work order
    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/work-orders");
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Gagal mengambil data.");
            }
            const result = await res.json();
            // Mengambil data dari properti 'data' di dalam JSON response
            const data = result.data || [];
            setWorkOrders(data);
        } catch (err) {
            showToast("error", "Error", err.message);
            setWorkOrders([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchWorkOrders();
    }, [fetchWorkOrders]);

    // Handler untuk membuka dialog update
    const handleUpdate = (workOrder) => {
        setSelectedWorkOrder(workOrder);
        setUpdateDialogOpen(true);
    };

    // Fungsi untuk menghapus item yang dipilih
    const handleDeleteSelected = async () => {
        // Implementasi logika hapus di sini
        showToast('success', 'Success', `${selectedWorkOrders.length} work order(s) deleted.`);
        // Contoh: panggil API untuk hapus, lalu fetch ulang data
        // await fetch('/api/technician/work-orders/delete', { ... });
        fetchWorkOrders();
        setSelectedWorkOrders([]);
    };

    // Fungsi untuk menampilkan dialog konfirmasi sebelum menghapus
    const confirmDeleteSelected = () => {
        confirmDialog({
            message: 'Apakah Anda yakin ingin menghapus item yang dipilih?',
            header: 'Konfirmasi Hapus',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: handleDeleteSelected,
            reject: () => {}
        });
    };

    const actionBodyTemplate = (rowData) => (
        <Button
            icon="pi pi-pencil"
            rounded
            outlined
            className="p-button-sm"
            onClick={() => handleUpdate(rowData)}
            tooltip="Update"
            tooltipOptions={{ position: "top" }}
        />
    );

    const filteredData = workOrders.filter((wo) => {
        const searchMatch = globalFilter ? Object.values(wo).some(val =>
            String(val).toLowerCase().includes(globalFilter.toLowerCase())
        ) : true;
        const statusMatch = statusFilter ? wo.status === statusFilter : true;
        return searchMatch && statusMatch;
    });

    const header = (
        <div className="flex flex-column md:flex-row justify-content-between gap-2">
            <div>
                <Dropdown
                    value={statusFilter}
                    options={statusFilterOptions}
                    onChange={(e) => setStatusFilter(e.value)}
                    placeholder="Filter by Status"
                    className="w-full md:w-auto"
                />
            </div>
            <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search keyword"
                    className="w-full md:w-auto"
                />
            </span>
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">Technician Work Orders</h3>
                        <p className="text-sm text-gray-500">
                            Lihat dan perbarui tugas yang diberikan kepada Anda.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined />
                    <Button size="small" label="Print" icon="pi pi-print" outlined />
                    <Divider layout="vertical" />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchWorkOrders} disabled={loading} />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel>
                        <DataTable
                            value={filteredData}
                            loading={loading}
                            dataKey="id"
                            paginator rows={10}
                            header={header}
                            emptyMessage="No work orders found."
                            selection={selectedWorkOrders}
                            onSelectionChange={(e) => setSelectedWorkOrders(e.value)}
                            selectionMode="multiple"
                        >
                            <Column header="Photo" body={photoBodyTemplate} style={{ width: '100px' }} />
                            <Column field="title" header="Title" sortable />
                            <Column field="description" header="Description" style={{ minWidth: '200px' }} />
                            <Column field="priority" header="Priority" body={(rowData) => <Tag value={rowData.priority} />} sortable />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column field="created_at" header="Schedule" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
                            <Column field="started_at" header="Started At" body={(rowData) => dateBodyTemplate(rowData.started_at)} sortable />
                            <Column field="completed_at" header="Completed At" body={(rowData) => dateBodyTemplate(rowData.completed_at)} sortable />
                            <Column field="notes" header="Notes" style={{ maxWidth: '200px' }} />
                            <Column header="Actions" body={actionBodyTemplate} />
                        </DataTable>
                    </Panel>
                </motion.div>
            </div>

            <UpdateWorkOrderDialog
                visible={isUpdateDialogOpen}
                onHide={() => setUpdateDialogOpen(false)}
                workOrder={selectedWorkOrder}
                fetchWorkOrders={fetchWorkOrders}
                showToast={showToast}
            />
        </div>
    );
}
