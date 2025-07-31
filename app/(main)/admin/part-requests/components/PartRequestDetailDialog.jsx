"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";
import { motion } from "framer-motion";
import { Divider } from "primereact/divider";
import { useState, useEffect } from "react";

const PartRequestDetailDialog = ({ visible, onHide, request, fetchPartRequests, showToast }) => {
    const [loading, setLoading] = useState(false);
    const [statusForm, setStatusForm] = useState({
        status: '',
        note: '',
        items: []
    });

    const statusOptions = [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
        { label: "Fulfilled", value: "fulfilled" }
    ];

    useEffect(() => {
        if (request && visible) {
            setStatusForm({
                status: request.status || 'pending',
                note: request.note || '',
                items: (request.items || []).map(item => ({
                    item_id: item.id,
                    part_name: item.part?.name || 'Unknown Part',
                    part_number: item.part?.part_number || 'N/A',
                    quantity_requested: item.quantity_requested || 0,
                    approved_quantity: item.quantity_approved || item.quantity_requested || 0,
                    note: item.note || ''
                }))
            });
        }
    }, [request, visible]);

    const handleStatusUpdate = async () => {
        if (!request) return;

        setLoading(true);
        try {
            const payload = {
                status: statusForm.status,
                note: statusForm.note,
                items: statusForm.items.map(item => ({
                    item_id: item.item_id,
                    approved_quantity: item.approved_quantity,
                    note: item.note
                }))
            };

            // Menggunakan API route handler
            const res = await fetch(`/api/admin/part-requests/${request.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Gagal mengupdate status");

            showToast("success", "Sukses", data.message || "Status berhasil diupdate");
            fetchPartRequests();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const getStatusSeverity = (status) => {
        switch (status) {
            case 'pending': return 'warning';
            case 'approved': return 'info';
            case 'rejected': return 'danger';
            case 'fulfilled': return 'success';
            default: return 'secondary';
        }
    };

    const handleItemApprovedQuantityChange = (itemId, value) => {
        setStatusForm(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.item_id === itemId
                    ? { ...item, approved_quantity: value }
                    : item
            )
        }));
    };

    const handleItemNoteChange = (itemId, value) => {
        setStatusForm(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.item_id === itemId
                    ? { ...item, note: value }
                    : item
            )
        }));
    };

    const approvedQuantityBodyTemplate = (rowData) => (
        <InputNumber
            value={rowData.approved_quantity}
            onValueChange={(e) => handleItemApprovedQuantityChange(rowData.item_id, e.value)}
            mode="decimal"
            min={0}
            max={rowData.quantity_requested}
            showButtons
            size="small"
            disabled={statusForm.status === 'fulfilled'}
        />
    );

    const itemNoteBodyTemplate = (rowData) => (
        <InputTextarea
            value={rowData.note}
            onChange={(e) => handleItemNoteChange(rowData.item_id, e.target.value)}
            rows={1}
            cols={20}
            placeholder="Optional note"
            disabled={statusForm.status === 'fulfilled'}
        />
    );

    const footer = (
        <div className="flex justify-end gap-2">
            <Button
                label="Cancel"
                icon="pi pi-times"
                onClick={onHide}
                className="p-button-text"
                disabled={loading}
            />
            <Button
                label="Update Status"
                icon="pi pi-check"
                onClick={handleStatusUpdate}
                loading={loading}
                disabled={loading || !statusForm.status}
            />
        </div>
    );

    if (!request) return null;

    return (
        <Dialog
            header={`Part Request Detail - ${request.id}`}
            visible={visible}
            style={{ width: "90vw", maxWidth: "1000px" }}
            breakpoints={{ "960px": "95vw", "641px": "95vw" }}
            onHide={onHide}
            modal
            className="p-fluid"
            footer={footer}
            maximizable
        >
            <div className="grid">
                {/* Request Information */}
                <div className="col-12 md:col-6">
                    <div className="card">
                        <h5>Request Information</h5>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">Request ID:</label>
                            <div className="col-12 md:col-8">
                                <span className="font-semibold">{request.id}</span>
                            </div>
                        </div>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">Requested By:</label>
                            <div className="col-12 md:col-8">
                                <span>{request.requested_by || 'Unknown'}</span>
                            </div>
                        </div>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">Work Order:</label>
                            <div className="col-12 md:col-8">
                                <span>{request.work_order_title || '-'}</span>
                            </div>
                        </div>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">WO Priority:</label>
                            <div className="col-12 md:col-8">
                                {(() => {
                                    const priority = request.work_order_priority || 'medium';
                                    const config = {
                                        low: { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-arrow-down' },
                                        medium: { bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-minus' },
                                        high: { bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-arrow-up' },
                                    }[priority] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question' };
                                    return (
                                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                                                <i className={`pi ${config.icon}`}></i>
                                                <span className="font-medium">{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">Created Date:</label>
                            <div className="col-12 md:col-8">
                                <span>{new Date(request.created_at).toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Management */}
                <div className="col-12 md:col-6">
                    <div className="card">
                        <h5>Status Management</h5>

                        <div className="field grid">
                            <label className="col-12 md:col-4 font-medium">Current Status:</label>
                            <div className="col-12 md:col-8">
                                {(() => {
                                    const status = request.status;
                                    const config = {
                                        pending: { bgColor: 'bg-orange-100', textColor: 'text-orange-800', icon: 'pi-clock', label: 'Pending' },
                                        approved: { bgColor: 'bg-cyan-100', textColor: 'text-cyan-800', icon: 'pi-spin pi-spinner', label: 'Approved' },
                                        fulfilled: { bgColor: 'bg-green-100', textColor: 'text-green-800', icon: 'pi-check-circle', label: 'Fulfilled' },
                                        rejected: { bgColor: 'bg-red-100', textColor: 'text-red-800', icon: 'pi-times-circle', label: 'Rejected' },
                                    }[status] || { bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: 'pi-question', label: status };
                                    return (
                                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
                                                <i className={`pi ${config.icon}`}></i>
                                                <span className="font-medium">{config.label}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="field grid">
                            <label htmlFor="status" className="col-12 md:col-4 font-medium">
                                New Status:
                            </label>
                            <div className="col-12 md:col-8">
                                <Dropdown
                                    id="status"
                                    value={statusForm.status}
                                    options={statusOptions}
                                    onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.value }))}
                                    placeholder="Select status"
                                />
                            </div>
                        </div>

                        <div className="field grid">
                            <label htmlFor="note" className="col-12 font-medium">Admin Note:</label>
                            <div className="col-12">
                                <InputTextarea
                                    id="note"
                                    value={statusForm.note}
                                    onChange={(e) => setStatusForm(prev => ({ ...prev, note: e.target.value }))}
                                    rows={3}
                                    placeholder="Optional admin note"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Divider />

            {/* Requested Items */}
            <div className="card">
                <h5>Requested Items</h5>
                <DataTable
                    value={statusForm.items}
                    className="border-round-lg"
                    emptyMessage="No items found"
                >
                    <Column
                        field="part_name"
                        header="Part Name"
                        style={{ width: "200px" }}
                    />
                    <Column
                        field="part_number"
                        header="Part Number"
                        style={{ width: "150px" }}
                    />
                    <Column
                        field="quantity_requested"
                        header="Requested Qty"
                        style={{ width: "120px" }}
                    />
                    <Column
                        header="Approved Qty"
                        body={approvedQuantityBodyTemplate}
                        style={{ width: "150px" }}
                    />
                    <Column
                        header="Item Note"
                        body={itemNoteBodyTemplate}
                        style={{ width: "200px" }}
                    />
                </DataTable>
            </div>
        </Dialog>
    );
};

export default PartRequestDetailDialog;
