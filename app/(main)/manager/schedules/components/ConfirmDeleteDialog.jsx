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
                res = await fetch("/api/manager/schedules/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ ids: selectedSchedules.map((p) => p.id) })
                });
            } else {
                res = await fetch(`/api/manager/schedules/${schedule.id}`, {
                    method: "DELETE",
                    credentials: "include"
                });
            }

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            const successMessage = isBulkDelete ? `${selectedSchedules.length} schedule berhasil dihapus` : "schedule berhasil dihapus";

            showToast("success", "Berhasil", successMessage);
            fetchSchedules();
            onHide();
        } catch (error) {
            showToast("error", "Gagal", error.message);
        } finally {
            setLoading(false);
        }
    };

     const footerContent = (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" severity="secondary" outlined onClick={onHide} disabled={loading} />
            <Button label="Ya, Hapus" severity="danger" onClick={handleDelete} loading={loading} />
        </div>
    );

    return (
        <Dialog header="Konfirmasi Hapus" visible={visible} onHide={onHide} modal footer={footerContent}>
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