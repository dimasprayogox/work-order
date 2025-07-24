"use client";

import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
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

    useEffect(() => {
        if (request) {
            setStatus(request.status);
            setNote(request.note || "");
            setItems(request.items.map(item => ({
                item_id: item.id,
                approved_quantity: item.quantity_approved ?? item.quantity_requested,
                name: item.part?.name || "Unknown"
            })));
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
            if (!res.ok) throw new Error(data.message || "Gagal update status");
            showToast("success", "Sukses", data.message);
            fetchRequests();
            onHide();
        } catch (err) {
            showToast("error", "Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog header="Update Status Permintaan" visible={visible} modal onHide={onHide} style={{ width: "600px" }}>
            <div className="space-y-4">
                <Dropdown value={status} options={statusOptions} onChange={(e) => setStatus(e.value)} placeholder="Pilih Status" className="w-full" />
                <InputTextarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Catatan" className="w-full" />

                <div>
                    <h4 className="font-semibold mb-2">Setujui Jumlah Item</h4>
                    {items.map((item, index) => (
                        <div key={item.item_id} className="mb-2 flex justify-between items-center">
                            <span>{item.name}</span>
                            <InputNumber value={item.approved_quantity} onValueChange={(e) => handleChangeQty(index, e.value)} />
                        </div>
                    ))}
                </div>

                <Button label="Simpan" onClick={handleSubmit} loading={loading} className="w-full" />
            </div>
        </Dialog>
    );
};

export default UpdateStatusDialog;
