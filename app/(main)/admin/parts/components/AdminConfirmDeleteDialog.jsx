"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const AdminConfirmDeleteDialog = ({ visible, onHide, part, selectedParts = [], fetchParts, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !part && selectedParts.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            let successMessage;

            if (isBulkDelete) {
                // Bulk delete using the delete-many endpoint
                res = await fetch("/api/admin/parts/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedParts.map((p) => p.id)
                    })
                });
                successMessage = `${selectedParts.length} part berhasil dihapus`;
            } else {
                // Single delete - menggunakan API route handler yang baru
                res = await fetch(`/api/admin/parts/${part.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
                successMessage = "Part berhasil dihapus";
            }

            const data = await res.json();

            if (res.ok && data.success) {
                showToast("success", "Berhasil", data.message || successMessage);
                fetchParts();
                onHide();
            } else {
                throw new Error(data.message || "Gagal menghapus part");
            }
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

    const footerContent = (
        <div className="flex justify-content-center gap-2">
            <Button label="Batal" icon="pi pi-times" severity="secondary" outlined onClick={onHide} disabled={loading} />
            <Button label="Ya, Hapus" icon="pi pi-trash" severity="danger" onClick={handleDelete} loading={loading} />
        </div>
    );

    const getDeleteMessage = () => {
        if (isBulkDelete) {
            return {
                title: `Hapus ${selectedParts.length} Part?`,
                message: `Anda akan menghapus ${selectedParts.length} part yang dipilih. Tindakan ini tidak dapat diurungkan.`
            };
        } else {
            return {
                title: "Hapus Part Ini?",
                message: (
                    <>
                        Anda akan menghapus <strong>{part?.name ?? "part yang dipilih"}</strong>.
                        <br />
                        Tindakan ini tidak dapat diurungkan.
                    </>
                )
            };
        }
    };

    const deleteInfo = getDeleteMessage();

    return (
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal style={{ width: "28rem" }} footer={footerContent}>
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle text-3xl" />
                    <p className="text-color-secondary m-0">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedParts.length} part yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus <strong>{part?.name ?? "part yang dipilih"}</strong>.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default AdminConfirmDeleteDialog;
