"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { API_ENDPOINTS } from "../../../../api/api";
import { useState } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, part, fetchParts, showToast }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {

        if (!part) {
            showToast("error", "Error", "Part yang akan dihapus tidak ditemukan.");
            setLoading(false);
            onHide(); // Tutup dialog jika terjadi error
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.PARTS}/delete-many`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({ ids: idsToDelete })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            showToast("success", "Berhasil", "Part berhasil dihapus");
            fetchParts();
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
                    <h3 className="font-bold mb-2">Hapus Part Ini?</h3>
                    <p className="text-color-secondary">
                        Anda akan menghapus <strong>{part?.name ?? "part yang dipilih"}</strong>.
                        <br />
                        Tindakan ini tidak dapat diurungkan.
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
