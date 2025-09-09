// app/(main)/admin/assets/components/ConfirmDeleteDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, asset, selectedAssets = [], fetchAssets, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !asset && selectedAssets.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                res = await fetch("/api/admin/assets/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedAssets.map((a) => a.id)
                    })
                });
            } else {
                res = await fetch(`/api/admin/assets/${asset.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete ? `${selectedAssets.length} asset berhasil dihapus` : "Asset berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchAssets();
            onHide();
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

    return (
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal footer={footerContent}>
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle text-3xl" />
                    <p className="text-color-secondary m-0">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedAssets.length} asset yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus <strong>{asset?.name ?? "asset yang dipilih"}</strong>.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
