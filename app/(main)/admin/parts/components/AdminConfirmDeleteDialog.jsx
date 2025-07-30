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
        <Dialog
            header="Konfirmasi Hapus"
            visible={visible}
            onHide={onHide}
            modal
            style={{ width: "28rem" }}
            footer={footerContent}
        >
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />

                <div>
                    <h3 className="font-bold mb-2">{deleteInfo.title}</h3>
                    <p className="text-color-secondary">
                        {deleteInfo.message}
                    </p>
                </div>

                {isBulkDelete && selectedParts.length > 0 && (
                    <div className="w-full">
                        <div className="text-left bg-gray-50 p-3 border-round">
                            <h4 className="font-medium mb-2">Part yang akan dihapus:</h4>
                            <ul className="list-none p-0 m-0 max-h-20rem overflow-auto">
                                {selectedParts.slice(0, 5).map((part, index) => (
                                    <li key={part.id} className="mb-1 text-sm">
                                        • {part.name} ({part.part_number})
                                    </li>
                                ))}
                                {selectedParts.length > 5 && (
                                    <li className="text-sm text-gray-500">
                                        ... dan {selectedParts.length - 5} lainnya
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default AdminConfirmDeleteDialog;
