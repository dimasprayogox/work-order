"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState, useCallback } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, workOrder, onDeleted, showToast }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = useCallback(async () => {
        if (!workOrder || !workOrder.id) {
            showToast("error", "Gagal", "Work Order tidak ditemukan.");
            onHide();
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/employee/issues/${workOrder.id}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Gagal menghapus Work Order.");
            }

            showToast("success", "Berhasil", "Work Order berhasil dihapus.");
            onDeleted();
            onHide();
        } catch (error) {
            console.error("Error deleting work order:", error);
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    }, [workOrder, onDeleted, onHide, showToast]);

    return (
        <Dialog header="Konfirmasi Hapus Work Order" visible={visible} onHide={onHide} modal style={{ width: "400px" }}>
            <div className="flex align-items-center gap-3">
                <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2rem' }} />
                <p>Anda yakin ingin menghapus Work Order: <strong>{workOrder?.title}</strong>?</p>
            </div>
            <div className="flex justify-content-end gap-2 mt-4">
                <Button label="Batal" onClick={onHide} outlined disabled={loading} />
                <Button label="Hapus" severity="danger" onClick={handleDelete} loading={loading} />
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;