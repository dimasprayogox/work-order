"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { useState, useEffect } from "react";

const PartRequestDetailDialog = ({ visible, onHide, request, fetchPartRequests, showToast }) => {
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [items, setItems] = useState([]);

    useEffect(() => {
        if (request && visible) {
            setNote(request.note || "");
            setItems(
                (request.items || []).map((item) => ({
                    item_id: item.id,
                    name: item.part?.name || "Unknown Part",
                    requested: item.quantity_requested || 0,
                    approved: item.quantity_approved ?? item.quantity_requested ?? 0,
                    available: item.part?.quantity_in_stock || 0, // Mengambil data stok
                    note: item.note || ""
                }))
            );
        }
    }, [request, visible]);

    // Menampilkan pesan jika status sudah final
    if (request && (request.status === "fulfilled" || request.status === "rejected")) {
        return (
            <Dialog header={`Request from: ${request.requested_by || "Unknown"}`} visible={visible} style={{ width: "min(90vw, 600px)" }} onHide={onHide} dismissableMask modal>
                <Message severity="info" text={`This request cannot be updated because its status is '${request.status}'.`} className="mb-0" />
            </Dialog>
        );
    }

    // Handler untuk mengubah kuantitas yang disetujui
    const handleChangeQty = (itemId, value) => {
        setItems((prevItems) =>
            prevItems.map((item) => {
                if (item.item_id === itemId) {
                    // Kuantitas tidak boleh melebihi yang diminta atau stok yang tersedia
                    const cappedValue = Math.min(value, item.requested, item.available);
                    return { ...item, approved: cappedValue };
                }
                return item;
            })
        );
    };

    // Handler untuk mengirim update status
    const handleSubmit = async (statusToSubmit) => {
        if (!request) return;

        setLoading(true);
        try {
            const payload = {
                status: statusToSubmit,
                note: note,
                items: items.map((item) => ({
                    item_id: item.item_id,
                    // Jika ditolak, approved_quantity jadi 0, jika tidak gunakan nilai dari state
                    approved_quantity: statusToSubmit === "rejected" ? 0 : item.approved,
                    note: item.note
                }))
            };

            const res = await fetch(`/api/admin/part-requests/${request.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update status");

            showToast("success", "Success", data.message || "Status updated successfully");
            fetchPartRequests();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const dialogHeader = request?.status === "pending" ? "Approve or Reject Request" : "Update to Fulfilled";

    return (
        <Dialog header={dialogHeader} visible={visible} style={{ width: "min(90vw, 550px)" }} onHide={onHide} dismissableMask modal>
            <div className="p-fluid">
                <div className="field">
                    <label htmlFor="admin-note" className="font-medium">
                        Admin Note
                    </label>
                    <InputTextarea id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Optional notes for this request" />
                </div>

                {/* Bagian item hanya tampil jika status 'pending' untuk approval */}
                {request?.status === "pending" && (
                    <div className="mt-4">
                        <h4 className="font-medium mb-3 text-base">Approve Items</h4>
                        <div className="space-y-3">
                            {items.map((item) => (
                                <div key={item.item_id} className="p-3 border-round border-1 surface-border">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <span className="font-medium text-sm text-900" title={item.name}>
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-500">
                                            Req: {item.requested} | Stock: {item.available}
                                        </span>
                                    </div>
                                    <div className="flex align-items-center justify-content-between">
                                        <label className="text-sm text-600">Approved Qty</label>
                                        <InputNumber
                                            value={item.approved}
                                            onValueChange={(e) => handleChangeQty(item.item_id, e.value)}
                                            min={0}
                                            max={Math.min(item.requested, item.available)}
                                            showButtons
                                            className="w-9rem"
                                            buttonLayout="horizontal"
                                            decrementButtonClassName="p-button-secondary"
                                            incrementButtonClassName="p-button-secondary"
                                            incrementButtonIcon="pi pi-plus"
                                            decrementButtonIcon="pi pi-minus"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tombol Aksi di Footer */}
                <div className="flex justify-end gap-2 mt-6">
                    <Button label="Close" icon="pi pi-times" onClick={onHide} className="p-button-text" disabled={loading} />

                    {request?.status === "pending" && <Button label="Reject" icon="pi pi-times-circle" className="p-button-danger" onClick={() => handleSubmit("rejected")} loading={loading} disabled={loading} />}

                    <Button
                        label={request?.status === "pending" ? "Approve" : "Set as Fulfilled"}
                        icon="pi pi-check-circle"
                        onClick={() => handleSubmit(request?.status === "pending" ? "approved" : "fulfilled")}
                        loading={loading}
                        disabled={loading}
                    />
                </div>
            </div>
        </Dialog>
    );
};

export default PartRequestDetailDialog;
