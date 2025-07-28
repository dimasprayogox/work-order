"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import { Message } from "primereact/message";
import { Divider } from "primereact/divider";
import { motion } from "framer-motion";
import DelegateTechnicianDialog from "./components/DelegateTechnicianDialog";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import WorkOrderDetailsDialog from "./components/WorkOrderDetailsDialog";

import {
    statusBodyTemplate,
    dateBodyTemplate,
    technicianBodyTemplate
} from "./components/WorkOrderTable";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3100/api";

export default function WorkOrderPage() {
    const toast = useRef(null);
    const [workOrders, setWorkOrders] = useState([]);
    const [selectedWorkOrders, setSelectedWorkOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("");
    const [searchText, setSearchText] = useState("");
    const [assignDialogVisible, setAssignDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
    const [viewDetailsDialogVisible, setViewDetailsDialogVisible] = useState(false);

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({
            severity,
            summary,
            detail,
            life: 3000
        });
    }, []);

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/manager/work-orders`, {
                credentials: "include"
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal mengambil daftar Work Order");
            }

            setWorkOrders(result.data || []);
        } catch (error) {
            showToast("error", "Error", error.message);
            setWorkOrders([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleTechnicianAssigned = useCallback((updatedWorkOrder) => {
        showToast("success", "Berhasil", "Teknisi berhasil ditugaskan.");
        setAssignDialogVisible(false);
        
        setWorkOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === updatedWorkOrder.id
                    ? {
                        ...order,
                        status: updatedWorkOrder.status,
                        assigned_to_id: updatedWorkOrder.assigned_to_id,
                        assigned_to: updatedWorkOrder.assigned_to || order.assigned_to,
                        scheduled_date: updatedWorkOrder.scheduled_date,
                        notes: updatedWorkOrder.notes
                    }
                    : order
            )
        );
        setSelectedWorkOrders([]);
    }, [showToast]);

    const handleDeleteSelected = () => {
        if (selectedWorkOrders.length === 0) return;
        setSelectedWorkOrder(selectedWorkOrders[0]);
        setDeleteDialogVisible(true);
    };

    const confirmDelete = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/manager/work-orders/${selectedWorkOrder.id}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Gagal menghapus Work Order");
            }

            showToast("success", "Berhasil", "Work Order berhasil dihapus");
            fetchWorkOrders();
            setDeleteDialogVisible(false);
            setSelectedWorkOrders([]);
        } catch (error) {
            showToast("error", "Error", error.message);
        }
    };

    const handleViewDetails = (rowData) => {
        setSelectedWorkOrder(rowData);
        setViewDetailsDialogVisible(true);
    };

    const filteredData = workOrders.filter((order) => {
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesSearch = !searchText ||
            order.title.toLowerCase().includes(searchText.toLowerCase()) ||
            (order.description && order.description.toLowerCase().includes(searchText.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    const actionBodyTemplate = (rowData) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-user-plus"
                    className="p-button-rounded p-button-info"
                    tooltip="Assign Technician"
                    onClick={() => {
                        setSelectedWorkOrder(rowData);
                        setAssignDialogVisible(true);
                    }}
                />
                <Button
                    icon="pi pi-eye"
                    className="p-button-rounded p-button-secondary"
                    tooltip="View Details"
                    onClick={() => handleViewDetails(rowData)}
                />
            </div>
        );
    };

    useEffect(() => {
        fetchWorkOrders();
    }, [fetchWorkOrders]);

    return (
        <div className="p-4">
            <Toast ref={toast} position="top-right" />

            <div className="card">
                <h3>Work Order Management</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                        label="Refresh"
                        icon="pi pi-refresh"
                        onClick={fetchWorkOrders}
                    />
                    <Button
                        label="Hapus Terpilih"
                        icon="pi pi-trash"
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedWorkOrders.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Dropdown
                        value={statusFilter}
                        options={[
                            { label: "Semua Status", value: "" },
                            { label: "Pending", value: "pending" },
                            { label: "Ditugaskan", value: "assigned" },
                            { label: "Dalam Proses", value: "in_progress" },
                            { label: "Selesai", value: "completed" },
                            { label: "Ditolak", value: "rejected" }
                        ]}
                        onChange={(e) => setStatusFilter(e.value)}
                        placeholder="Filter berdasarkan Status"
                    />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            placeholder="Cari..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </span>
                </div>

                <Panel header="Daftar Work Order">
                    <DataTable
                        value={filteredData}
                        loading={loading}
                        selection={selectedWorkOrders}
                        onSelectionChange={(e) => setSelectedWorkOrders(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="Tidak ada Work Order ditemukan"
                        selectionMode="multiple"
                        className="border-round-lg"
                        header={
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-xl font-bold">Semua Work Order</span>
                                <span>Total: {filteredData.length}</span>
                            </div>
                        }
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                        <Column field="title" header="Judul" sortable />
                        <Column field="machine.name" header="Mesin" sortable />
                        <Column field="priority" header="Prioritas" sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column header="Ditugaskan Kepada" body={technicianBodyTemplate} sortable />
                        <Column
                            header="Tanggal Terjadwal"
                            body={(row) => dateBodyTemplate(row, "scheduled_date")}
                            sortable
                        />
                        <Column
                            header="Dibuat Pada"
                            body={(row) => dateBodyTemplate(row, "created_at")}
                            sortable
                        />
                        <Column
                            header="Aksi"
                            body={actionBodyTemplate}
                            style={{ minWidth: "10rem" }}
                        />
                    </DataTable>
                </Panel>
            </div>

            <DelegateTechnicianDialog
                visible={assignDialogVisible}
                onHide={() => setAssignDialogVisible(false)}
                workOrder={selectedWorkOrder}
                showToast={showToast}
                onTechnicianAssigned={handleTechnicianAssigned}
            />

            <ConfirmDeleteDialog
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                onConfirm={confirmDelete}
                itemType="work order"
                itemName={selectedWorkOrder?.title}
            />

            <WorkOrderDetailsDialog
                visible={viewDetailsDialogVisible}
                onHide={() => setViewDetailsDialogVisible(false)}
                workOrder={selectedWorkOrder}
            />
        </div>
    );
}