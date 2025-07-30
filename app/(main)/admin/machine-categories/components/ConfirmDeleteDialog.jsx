"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({
    visible,
    onHide,
    category,
    selectedCategories = [],
    fetchCategories,
    showToast
}) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !category && selectedCategories.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                // Menggunakan API route handler untuk delete many
                res = await fetch("/api/admin/machine-categories/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedCategories.map((c) => c.id)
                    })
                });
            } else {
                // Menggunakan API route handler untuk delete single
                res = await fetch(`/api/admin/machine-categories/${category.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete
                ? `${selectedCategories.length} kategori berhasil dihapus`
                : "Kategori berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchCategories();
            onHide();
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
                            ? `Hapus ${selectedCategories.length} Kategori?`
                            : "Hapus Kategori Ini?"
                        }
                    </h3>
                    <p className="text-color-secondary">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedCategories.length} kategori yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus kategori <strong>{category?.name ?? "yang dipilih"}</strong>.
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
