"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({
    visible,
    onHide,
    user,
    selectedUsers = [],
    fetchUsers,
    showToast
}) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !user && selectedUsers.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                // Menggunakan API route handler yang baru untuk bulk delete
                res = await fetch("/api/admin/users/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedUsers.map((u) => u.id)
                    })
                });
            } else {
                // Menggunakan API route handler yang baru untuk single delete
                res = await fetch(`/api/admin/users/${user.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete
                ? `${selectedUsers.length} user berhasil dihapus`
                : "User berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchUsers();
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
                            ? `Hapus ${selectedUsers.length} User?`
                            : "Hapus User Ini?"
                        }
                    </h3>
                    <p className="text-color-secondary">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedUsers.length} user yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus user <strong>{user?.username ?? "yang dipilih"}</strong>
                                {user?.full_name && ` (${user.full_name})`}.
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
