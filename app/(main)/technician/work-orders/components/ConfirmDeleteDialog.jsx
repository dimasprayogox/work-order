"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { API_ENDPOINTS } from "../../../../api/api";
import { useState } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, part, fetchParts, showToast }) => {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_ENDPOINTS.PARTS}/${part.id}`, {
                method: "DELETE",
                credentials: "include"
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

    return (
        <Dialog header="Delete Confirmation" visible={visible} onHide={onHide} modal style={{ width: "400px" }}>
            <p>Are you sure you want to delete part <strong>{part?.name}</strong>?</p>
            <div className="flex justify-end gap-2 mt-4">
                <Button label="Cancel" onClick={onHide} outlined />
                <Button label="Delete" severity="danger" onClick={handleDelete} loading={loading} />
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
