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
        <Dialog
            header="Konfirmasi Hapus"
            visible={visible}
            onHide={onHide}
            modal
            style={{ width: "30rem" }}
            footer={footerContent}
        >
            <div className="flex flex-column align-items-center text-center gap-4 py-4">
                <i className="pi pi-exclamation-triangle text-red-500 text-6xl" />

                <div>
                    <h3 className="font-bold mb-2">
                        {isBulkDelete ? `Hapus ${selectedSchedules.length} Schedule?` : "Hapus Schedule Ini?"}
                    </h3>

                    <p className="text-color-secondary mb-3">
                        {getWarningMessage()}
                        <br />
                        Tindakan ini tidak dapat diurungkan.
                    </p>

                    <div className="p-3 border-left-3 border-red-500 bg-red-50 text-left">
                        <div className="flex align-items-center gap-2 mb-2">
                            <i className="pi pi-info-circle text-red-600"></i>
                            <span className="font-semibold text-red-800">Yang akan dihapus:</span>
                        </div>
                        <ul className="text-red-700 text-sm m-0 pl-3">
                            <li>Data schedule maintenance</li>
                            <li>Jadwal maintenance yang terkait</li>
                            {!isBulkDelete && schedule?.next_due_date && (
                                <li>Jadwal berikutnya: {new Date(schedule.next_due_date).toLocaleDateString('id-ID')}</li>
                            )}
                        </ul>
                    </div>

                    <div className="p-3 border-left-3 border-yellow-500 bg-yellow-50 text-left mt-3">
                        <div className="flex align-items-center gap-2 mb-2">
                            <i className="pi pi-exclamation-triangle text-yellow-600"></i>
                            <span className="font-semibold text-yellow-800">Peringatan</span>
                        </div>
                        <p className="text-yellow-700 text-sm m-0">
                            Work Order yang sudah dibuat dari schedule ini tidak akan terpengaruh dan tetap ada dalam sistem.
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ConfirmDeleteDialog;
