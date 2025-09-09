// app/(main)/issues/components/ConfirmDeleteDialog.jsx
"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, issue, selectedIssues = [], fetchIssues, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !issue && selectedIssues.length > 0;

    // Check if any selected issues are not in 'open' status
    const hasNonOpenIssues = () => {
        if (isBulkDelete) {
            return selectedIssues.some(issue => issue.status !== 'open');
        }
        return issue && issue.status !== 'open';
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                res = await fetch("/api/admin/issues/delete-many", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        ids: selectedIssues.map((i) => i.id)
                    })
                });
            } else {
                res = await fetch(`/api/admin/issues/${issue.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete
                ? `${selectedIssues.length} issue berhasil dihapus`
                : "Issue berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchIssues();
            onHide();
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

    const getDeleteWarning = () => {
        if (hasNonOpenIssues()) {
            if (isBulkDelete) {
                const nonOpenCount = selectedIssues.filter(issue => issue.status !== 'open').length;
                return `${nonOpenCount} dari ${selectedIssues.length} issue yang dipilih tidak berstatus 'pending' dan tidak dapat dihapus.`;
            } else {
                return `Issue ini berstatus '${issue.status}' dan tidak dapat dihapus. Hanya issue dengan status 'pending' yang dapat dihapus.`;
            }
        }
        return null;
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
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal footer={footerContent}>
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle text-3xl" />
                    <p className="text-color-secondary m-0">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedIssues.length} issue yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus issue <strong>&quot;{issue?.title}&quot;</strong>.
                            </>
                        )}
                    </p>
                </div>
                {getDeleteWarning() && (
                    <div className="p-3 border-left-3 border-yellow-500 bg-yellow-50 text-left">
                        <div className="flex align-items-center gap-2 mb-2"></div>
                        <p className="text-yellow-700 text-sm m-0">{getDeleteWarning()}</p>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
