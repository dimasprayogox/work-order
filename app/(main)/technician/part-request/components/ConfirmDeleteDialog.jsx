"use client";

import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { useState } from 'react';

const ConfirmDeleteDialog = ({ visible, onHide, request, selectedRequests = [], fetchRequests, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !request && selectedRequests.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            if (isBulkDelete) {
                const nonPendingItems = selectedRequests.filter((item) => item.status !== "pending");
                if (nonPendingItems.length > 0) {
                    const statuses = [...new Set(nonPendingItems.map((item) => item.status))];
                    throw new Error(`Hanya part request dengan status "Pending" yang dapat dihapus. Terdapat item dengan status: ${statuses.join(", ")}`);
                }
            } else if (request && request.status !== "pending") {
                throw new Error(`Hanya part request dengan status "Pending" yang dapat dihapus. Status saat ini: ${request.status}`);
            }

            let res;
            if (isBulkDelete) {
                res = await fetch("/api/technician/part-request/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ ids: selectedRequests.map((p) => p.id) })
                });
            } else {
                res = await fetch(`/api/technician/part-request/${request.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete ? `${selectedRequests.length} part request berhasil dihapus` : "part request berhasil dihapus";

            showToast("success", "Success", successMessage);
            fetchRequests();
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
                            `Anda akan menghapus ${selectedRequests.length} part request yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus <strong>{request?.title ?? "part request yang dipilih"}</strong>.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;