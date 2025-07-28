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
                throw new Error(result.message || "Failed to fetch work orders");
            }

            setWorkOrders(result.data || []);
        } catch (error) {
            showToast("error", "Error", error.message);
            setWorkOrders([]);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleTechnicianAssigned = () => {
        showToast("success", "Success", "Technician assigned successfully.");
        setAssignDialogVisible(false);
        fetchWorkOrders();
    };

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
                throw new Error(result.message || "Failed to delete work order");
            }

            showToast("success", "Success", "Work order deleted successfully");
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
                        label="Delete Selected"
                        icon="pi pi-trash"
                        severity="danger"
                        onClick={handleDeleteSelected}
                        disabled={selectedWorkOrders.length === 0}
                    />
                    <Divider layout="vertical" />
                    <Dropdown
                        value={statusFilter}
                        options={[
                            { label: "All Status", value: "" },
                            { label: "Pending", value: "pending" },
                            { label: "Assigned", value: "assigned" },
                            { label: "In Progress", value: "in_progress" },
                            { label: "Completed", value: "completed" },
                            { label: "Rejected", value: "rejected" }
                        ]}
                        onChange={(e) => setStatusFilter(e.value)}
                        placeholder="Filter by Status"
                    />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </span>
                </div>

                <Panel header="Work Orders List">
                    <DataTable
                        value={filteredData}
                        loading={loading}
                        selection={selectedWorkOrders}
                        onSelectionChange={(e) => setSelectedWorkOrders(e.value)}
                        dataKey="id"
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No work orders found"
                        selectionMode="multiple"
                        className="border-round-lg"
                        header={
                            <div className="flex justify-content-between align-items-center">
                                <span className="text-xl font-bold">All Work Orders</span>
                                <span>Total: {filteredData.length}</span>
                            </div>
                        }
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
                        <Column field="title" header="Title" sortable />
                        <Column field="machine.name" header="Machine" sortable />
                        <Column field="priority" header="Priority" sortable />
                        <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                        <Column header="Assigned To" body={technicianBodyTemplate} sortable />
                        <Column
                            header="Scheduled Date"
                            body={(row) => dateBodyTemplate(row, "scheduled_date")}
                            sortable
                        />
                        <Column
                            header="Created At"
                            body={(row) => dateBodyTemplate(row, "created_at")}
                            sortable
                        />
                        <Column
                            header="Actions"
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
                fetchWorkOrders={fetchWorkOrders}
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