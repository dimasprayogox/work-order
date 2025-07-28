"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { Panel } from "primereact/panel";
import { motion } from "framer-motion";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

import ItemDetailDialog from "./components/ItemDetailDialog";
import CreatePartRequestDialog from "./components/CreatePartRequestDialog";

const statusBodyTemplate = (rowData) => {
    const statusMap = {
        pending: { label: "Pending", severity: "warning" },
        approved: { label: "Approved", severity: "info" },
        fulfilled: { label: "Fulfilled", severity: "success" },
        rejected: { label: "Rejected", severity: "danger" },
    };
    const statusInfo = statusMap[rowData.status] || { label: rowData.status.toUpperCase(), severity: "secondary" };
    return <Tag value={statusInfo.label} severity={statusInfo.severity} />;
};

const dateBodyTemplate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

export default function PartRequestPage() {
    const [partRequests, setPartRequests] = useState([]);
    const [selectedRequests, setSelectedRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const toast = useRef(null);

    const [isDetailVisible, setDetailVisible] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [isCreateVisible, setCreateVisible] = useState(false);
    const [isFormLoading, setFormLoading] = useState(false);
    const [formInitialData, setFormInitialData] = useState({ workOrders: [], parts: [] });

    const showToast = useCallback((severity, summary, detail) => {
        toast.current.show({ severity, summary, detail, life: 3000 });
    }, []);

    const fetchPartRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/technician/part-request");
            if (!res.ok) throw new Error((await res.json()).message || "Failed to fetch data.");
            const result = await res.json();
            setPartRequests(result.data || []);
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchPartRequests();
    }, [fetchPartRequests]);

    // --- Delete multiple requests ---
    const deleteSelectedRequests = async () => {
        setLoading(true);
        try {
            const idsToDelete = selectedRequests.map(req => req.id);
            const res = await fetch(`/api/technician/part-request`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: idsToDelete }),
            });

            if (!res.ok) throw new Error((await res.json()).message || "Failed to delete selected requests.");

            showToast('success', 'Success', `${selectedRequests.length} requests have been deleted.`);
            fetchPartRequests();
            setSelectedRequests([]);
        } catch (err) {
            showToast('error', 'Error', err.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteSelected = () => {
        confirmDialog({
            message: `Are you sure you want to delete the ${selectedRequests.length} selected requests?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: deleteSelectedRequests,
        });
    };

    const isDeleteDisabled = selectedRequests.length === 0 || selectedRequests.some(req => req.status !== 'pending');

    // --- Delete single request ---
    const confirmDeleteSingle = (request) => {
        confirmDialog({
            message: `Are you sure you want to delete the request for Work Order "${request.workOrder?.title}"?`,
            header: 'Confirm Deletion',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                setLoading(true);
                try {
                    const res = await fetch(`/api/technician/part-request/${request.id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error((await res.json()).message || "Failed to delete request.");
                    showToast('success', 'Success', 'Part request has been deleted.');
                    fetchPartRequests();
                } catch (err) {
                    showToast('error', 'Error', err.message);
                } finally {
                    setLoading(false);
                }
            },
        });
    };

    const handleShowItems = (items) => {
        setSelectedItems(items);
        setDetailVisible(true);
    };

    const handleCreate = async () => {
        setFormLoading(true);
        try {
            const [woRes, partsRes] = await Promise.all([
                fetch('/api/technician/work-orders?status=open'),
                fetch('/api/technician/part')
            ]);
            if (!woRes.ok || !partsRes.ok) throw new Error('Failed to load data for the form.');
            const woResult = await woRes.json();
            const partsResult = await partsRes.json();
            setFormInitialData({ workOrders: woResult.data || [], parts: partsResult.data || [] });
            setCreateVisible(true);
        } catch (err) {
            showToast("error", "Data Preparation Error", err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const actionBodyTemplate = (rowData) => (
        <div className="flex gap-2">
            <Button icon="pi pi-eye" rounded outlined className="p-button-sm" onClick={() => handleShowItems(rowData.items)} tooltip="View Items" tooltipOptions={{ position: "top" }} disabled={!rowData.items || rowData.items.length === 0} />
            <Button icon="pi pi-trash" rounded outlined severity="danger" className="p-button-sm" onClick={() => confirmDeleteSingle(rowData)} tooltip="Delete" tooltipOptions={{ position: "top" }} disabled={rowData.status !== 'pending'} />
        </div>
    );

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="card">
                <div className="flex justify-content-between items-start mb-4">
                    <div>
                        <h3 className="text-2xl font-semibold">My Part Requests</h3>
                        <p className="text-sm text-gray-500">Manage the part requests you have created.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <Button size="small" label="Back" icon="pi pi-arrow-left" outlined disabled />
                    <Button size="small" label="New Request" icon="pi pi-plus" severity="success" outlined onClick={handleCreate} loading={isFormLoading} />
                    <Divider layout="vertical" />
                    <Button size="small" label="Import" icon="pi pi-file-import" outlined disabled />
                    <Button size="small" label="Export" icon="pi pi-file-export" outlined disabled />
                    <Button size="small" label="Print" icon="pi pi-print" outlined disabled />
                    <Divider layout="vertical" />
                    <Button size="small" label="Delete" icon="pi pi-trash" severity="danger" outlined onClick={confirmDeleteSelected} disabled={isDeleteDisabled} />
                    <Button size="small" label="Refresh" icon="pi pi-refresh" outlined onClick={fetchPartRequests} disabled={loading} />
                </div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Panel>
                        <DataTable
                            value={partRequests}
                            loading={loading}
                            dataKey="id"
                            paginator
                            rows={10}
                            selection={selectedRequests}
                            onSelectionChange={(e) => setSelectedRequests(e.value)}
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                            <Column field="workOrder.title" header="Work Order" sortable style={{ minWidth: '16rem' }} />
                            <Column field="status" header="Status" body={statusBodyTemplate} sortable />
                            <Column field="note" header="Notes" style={{ maxWidth: '200px' }} />
                            <Column field="created_at" header="Requested At" body={(rowData) => dateBodyTemplate(rowData.created_at)} sortable />
                            <Column header="Actions" body={actionBodyTemplate} style={{ width: '8rem', textAlign: 'center' }} />
                        </DataTable>
                    </Panel>
                </motion.div>
            </div>

            <ItemDetailDialog visible={isDetailVisible} onHide={() => setDetailVisible(false)} items={selectedItems} />
            <CreatePartRequestDialog visible={isCreateVisible} onHide={() => setCreateVisible(false)} fetchPartRequests={fetchPartRequests} showToast={showToast} initialData={formInitialData} loading={isFormLoading} />
        </div>
    );
}
