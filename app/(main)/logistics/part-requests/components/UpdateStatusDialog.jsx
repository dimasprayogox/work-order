"use client";

import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { classNames } from "primereact/utils";
import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../../../../api/api";

const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Fulfilled", value: "fulfilled" }
];

const UpdateStatusDialog = ({ visible, onHide, request, fetchRequests, showToast }) => {
    const [status, setStatus] = useState(null);
    const [note, setNote] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted] = useState(false);

    useEffect(() => {
        if (request) {
            setStatus(request.status);
            setNote(request.note || "");
            setItems(
                request.items.map((item) => ({
                    item_id: item.id,
                    approved_quantity: item.quantity_approved ?? item.quantity_requested,
                    name: item.part?.name || "Unknown",
                    requested_quantity: item.quantity_requested
                }))
            );
        }
    }, [request]);

    const handleChangeQty = (index, value) => {
        const updated = [...items];
        updated[index].approved_quantity = value;
        setItems(updated);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.PART_REQUESTS}/${request.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    status,
                    note,
                    items
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update status");
            showToast("success", "Success", data.message);
            fetchRequests();
            onHide();
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog header="Update Request Status" visible={visible} style={{ width: "32rem" }} breakpoints={{ "960px": "75vw", "641px": "90vw" }} onHide={onHide} modal className="p-fluid">
            <div className="field grid mb-4">
                <label htmlFor="status" className="col-12 mb-2 font-medium">
                    Status <span className="text-red-500">*</span>
                </label>
                <div className="col-12">
                    <Dropdown id="status" value={status} options={statusOptions} onChange={(e) => setStatus(e.value)} placeholder="Select Status" className={classNames({ "p-invalid": submitted && !status })} />
                    {submitted && !status && <small className="p-error">Status is required</small>}
                </div>
            </div>

            <div className="field grid mb-4">
                <label htmlFor="note" className="col-12 mb-2 font-medium">
                    Notes
                </label>
                <div className="col-12">
                    <InputTextarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add notes here..." autoResize />
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-medium mb-3">Approve Items</h4>
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.item_id} className="p-3 border-round border-1 surface-border">
                            <div className="flex align-items-center justify-content-between mb-2">
                                <span className="font-medium text-sm text-900 line-clamp-1" title={item.name}>
                                    {item.name}
                                </span>
                                <span className="text-xs text-500">Requested: {item.requested_quantity}</span>
                            </div>
                            <div className="flex align-items-center justify-content-between">
                                <label htmlFor={`quantity-${index}`} className="text-sm text-600">
                                    Approved Qty
                                </label>
                                <InputNumber
                                    id={`quantity-${index}`}
                                    value={item.approved_quantity}
                                    onValueChange={(e) => handleChangeQty(index, e.value)}
                                    mode="decimal"
                                    min={0}
                                    max={item.requested_quantity}
                                    showButtons
                                    buttonLayout="horizontal"
                                    incrementButtonClassName="p-button-sm"
                                    decrementButtonClassName="p-button-sm"
                                    className="w-8rem"
                                    inputClassName="text-center w-3rem"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button label="Cancel" icon="pi pi-times" onClick={onHide} className="p-button-secondary" disabled={loading} />
                <Button label="Save" icon="pi pi-check" onClick={handleSubmit} loading={loading} disabled={loading} />
            </div>
        </Dialog>
    );
};

export default UpdateStatusDialog;
