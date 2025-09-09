"use client";

import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import { useState } from "react";

const ConfirmDeleteDialog = ({ visible, onHide, schedule, selectedSchedules = [], fetchSchedules, showToast }) => {
    const [loading, setLoading] = useState(false);

    const isBulkDelete = !schedule && selectedSchedules.length > 0;

    const handleDelete = async () => {
        setLoading(true);
        try {
            let res;
            if (isBulkDelete) {
                // For bulk delete, we need to implement a delete-many endpoint
                const deletePromises = selectedSchedules.map(s =>
                    fetch(`/api/admin/schedules/${s.id}`, {
                        method: "DELETE",
                        credentials: "include"
                    })
                );

                const responses = await Promise.allSettled(deletePromises);
                const failedDeletes = responses.filter(r => r.status === 'rejected' || (r.value && !r.value.ok));

                if (failedDeletes.length > 0) {
                    throw new Error(`${failedDeletes.length} schedule(s) gagal dihapus`);
                }

                showToast("success", "Berhasil", `${selectedSchedules.length} schedule berhasil dihapus`);
            } else {
                res = await fetch(`/api/admin/schedules/${schedule.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                showToast("success", "Berhasil", "Schedule berhasil dihapus");
            }

            fetchSchedules();
            onHide();
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

    const getWarningMessage = () => {
        if (isBulkDelete) {
            return `Anda akan menghapus ${selectedSchedules.length} schedule yang dipilih.`;
        } else {
            return (
                <>
                    Anda akan menghapus schedule <strong>&quot;{schedule?.title}&quot;</strong>.
                </>
            );
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
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal style={{ width: "30rem" }} footer={footerContent}>
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <div className="flex align-items-center justify-content-center gap-3">
                    <i className="pi pi-exclamation-triangle text-3xl" />
                    <p className="text-color-secondary m-0">
                        {isBulkDelete ? (
                            `Anda akan menghapus ${selectedSchedules.length} schedule yang dipilih.`
                        ) : (
                            <>
                                Anda akan menghapus <strong>{schedule?.name ?? "schedule yang dipilih"}</strong>.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
