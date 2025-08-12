"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState, useCallback } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, workOrder, selectedWorkOrders = [], fetchWorkOrders, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !workOrder && selectedWorkOrders.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                res = await fetch("/api/employee/issues/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ ids: selectedWorkOrders.map((p) => p.id) })
                });
            } else {
                if (!workOrder || !workOrder.id) {
                    throw new Error("Data work order tidak valid. Tidak dapat menghapus.");
                }
                res = await fetch(`/api/employee/issues/${workOrder.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete ? `${selectedWorkOrders.length} work order berhasil dihapus` : "Part berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchWorkOrders();
            onHide();
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" severity="secondary" outlined onClick={onHide} disabled={loading} />
            <Button label="Ya, Hapus" severity="danger" onClick={handleDelete} loading={loading} />
        </div>
    );

return (
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal footer={footerContent}>
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle text-3xl" />
                    <p className="text-color-secondary m-0">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedWorkOrders.length} work order yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus <strong>{workOrder?.name ?? "work order yang dipilih"}</strong>.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
