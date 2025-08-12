"use client";
import { Dialog } from "primereact/dialog";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { useState, useEffect } from "react";

const UpdateStatusDialog = ({ visible, onHide, request, fetchRequests, showToast }) => {
    const [note, setNote] = useState("");
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (request) {
            setNote(request.note || "");
            setItems(
                request.items.map((item) => ({
                    id: item.id,
                    name: item.part?.name || "Unknown Part",
                    requested: item.quantity_requested,
                    approved: item.quantity_approved ?? item.quantity_requested,
                    available: item.part?.quantity_in_stock || 0
                }))
            );
        }
    }, [request]);

    if (request?.status === "fulfilled" || request?.status === "rejected") {
        return (
            <Dialog header={`Request : '${request.note}'`} visible={visible} style={{ width: "600px" }} onHide={onHide} dismissableMask>
                <div className="p-fluid">
                    <Message severity="info" text={`This request cannot be updated because its status is '${request.status}'.`} className="mb-4" />
                </div>
            </Dialog>
        );
    }

    const handleChangeQty = (index, value) => {
        const newItems = [...items];
        newItems[index].approved = Math.min(value, newItems[index].requested, newItems[index].available);
        setItems(newItems);
    };

    const handleSubmit = async (statusToSubmit) => {
        if (!statusToSubmit || !request?.id) {
            showToast("error", "Error", "Invalid request data");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                status: statusToSubmit,
                note: note || undefined, // Menggunakan undefined jika note kosong
                items: items.map((item) => ({
                    item_id: item.id,
                    approved_quantity: statusToSubmit === "rejected" ? 0 : item.approved
                }))
            };

            console.log("Submitting payload:", payload); // Debugging

            const res = await fetch(`/api/logistics/part-requests/${request.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const error = await res.json().catch(() => ({}));
                throw new Error(error.message || `HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            showToast("success", "Success", "Status updated successfully");
            fetchRequests();
            onHide();
        } catch (err) {
            console.error("Submit error:", err);
            showToast("error", "Error", err.message || "Failed to update status");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog header={request?.status === "pending" ? "Approve or Reject Request" : "Update Request"} visible={visible} style={{ width: "500px" }} onHide={onHide} dismissableMask>
            <div className="p-fluid">
                <div className="field">
                    <label>Notes</label>
                    <InputTextarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Enter notes" />
                </div>

                {request?.status === "pending" && (
                    <div className="mb-6">
                        <h4 className="font-medium mb-3">Approve Items</h4>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id} className="p-3 border-round border-1 surface-border">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="font-medium text-sm text-900 line-clamp-1" title={item.name}>
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-500">
                                            Requested: {item.requested} | Stock: {item.available}
                                        </span>
                                    </div>
                                    <div className="flex align-items-center justify-content-between">
                                        <label htmlFor={`quantity-${index}`} className="text-sm text-600">
                                            Approved Qty
                                        </label>
                                        <InputNumber value={item.approved} onValueChange={(e) => handleChangeQty(index, e.value)} min={0} max={Math.min(item.requested, item.available)} showButtons className="w-8rem" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-secondary" />

                    {request?.status === "pending" && <Button label="Reject" icon="pi pi-times-circle" className="p-button-danger" onClick={() => handleSubmit("rejected")} disabled={loading} />}

                    <Button label={request?.status === "pending" ? "Approve" : "Fulfilled"} icon="pi pi-check" onClick={() => handleSubmit(request?.status === "pending" ? "approved" : "fulfilled")} loading={loading} />
                </div>
            </div>
        </Dialog>
    );
};

export default UpdateStatusDialog;
