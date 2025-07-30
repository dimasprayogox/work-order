"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({
    visible,
    onHide,
    request,
    selectedRequests = [],
    fetchPartRequests,
    showToast,
    onDeleteSuccess
}) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !request && selectedRequests.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                // Menggunakan API route handler untuk bulk delete
                res = await fetch("/api/admin/part-requests/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedRequests.map((r) => r.id)
                    })
                });
            } else {
                // Menggunakan API route handler untuk single delete
                res = await fetch(`/api/admin/part-requests/${request.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete
                ? `${selectedRequests.length} part request berhasil dihapus`
                : "Part request berhasil dihapus";

            showToast("success", "Berhasil", successMessage);

            // Call success callback if provided, otherwise use default behavior
            if (onDeleteSuccess) {
                onDeleteSuccess();
            } else {
                fetchPartRequests();
                onHide();
            }
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <div className="flex justify-content-center gap-2">
            <Button
                label="Batal"
                icon="pi pi-times"
                severity="secondary"
                outlined
                onClick={onHide}
                disabled={loading}
            />
            <Button
                label="Ya, Hapus"
                icon="pi pi-trash"
                severity="danger"
                onClick={handleDelete}
                loading={loading}
            />
        </div>
    );

    return (
        <Dialog
            header="Konfirmasi Hapus"
            visible={visible}
            onHide={onHide}
            modal
            style={{ width: "25rem" }}
            footer={footerContent}
        >
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />

                <div>
                    <h3 className="font-bold mb-2">
                        {isBulkDelete
                            ? `Hapus ${selectedRequests.length} Part Request?`
                            : "Hapus Part Request Ini?"
                        }
                    </h3>
                    <p className="text-color-secondary">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedRequests.length} part request yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus part request <strong>{request?.id ?? "yang dipilih"}</strong>.
                            </>
                        )}
                        <br />
                        Tindakan ini tidak dapat diurungkan.
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
