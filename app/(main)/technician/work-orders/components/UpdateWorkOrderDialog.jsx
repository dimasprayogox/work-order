"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { InputNumber } from "primereact/inputnumber";
import { Message } from "primereact/message";
import { motion } from "framer-motion";

export default function UpdateWorkOrderDialog({ visible, onHide, workOrder, fetchWorkOrders, showToast }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        status: "",
        description: "",
        started_at: null,
        completed_at: null,
        actual_labor: null,
    });
    const [formErrors, setFormErrors] = useState({});

    // Menentukan apakah form bisa diedit berdasarkan status
    const isEditable = workOrder?.status === 'open' || workOrder?.status === 'in_progress';

    // Mengisi form dengan data work order yang ada saat dialog muncul
    useEffect(() => {
        if (workOrder) {
            // Secara otomatis mengatur status ke tahap berikutnya
            let nextStatus = workOrder.status;
            if (workOrder.status === 'open') {
                nextStatus = 'in_progress';
            } else if (workOrder.status === 'in_progress') {
                nextStatus = 'completed';
            }

            setFormData({
                status: nextStatus,
                description: workOrder.description || "",
                started_at: workOrder.started_at ? new Date(workOrder.started_at) : new Date(), // Default ke waktu sekarang jika mulai
                completed_at: workOrder.completed_at ? new Date(workOrder.completed_at) : null,
                actual_labor: workOrder.actual_labor || null,
            });
        }
        setFormErrors({});
    }, [workOrder]);

    const validateForm = useCallback(() => {
        const errors = {};
        if (!formData.status) {
            errors.status = "Status harus dipilih.";
        }
        // Validasi: Jika status diubah ke 'in_progress', tanggal mulai harus ada
        if (formData.status === 'in_progress' && !formData.started_at) {
            errors.started_at = "Tanggal mulai harus diisi saat status 'In Progress'.";
        }
        // Validasi: Jika status diubah ke 'completed', tanggal selesai harus ada
        if (formData.status === 'completed' && !formData.completed_at) {
            errors.completed_at = "Tanggal selesai harus diisi saat status 'Completed'.";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e, field) => {
        const value = e.target ? e.target.value : e.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = async () => {
        if (!validateForm()) {
            showToast("error", "Validation Failed", "Harap periksa kembali isian form.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
              status: formData.status,
              description: formData.description,
              ...(formData.started_at && { started_at: formData.started_at.toISOString() }),
              ...(formData.completed_at && { completed_at: formData.completed_at.toISOString() }),
            };

            const response = await fetch(`/api/technician/work-orders/${workOrder.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Gagal memperbarui work order");
            }

            showToast("success", "Success", result.message || "Work order berhasil diperbarui");
            fetchWorkOrders();
            onHide();
        } catch (error) {
            showToast("error", "Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderFooter = isEditable ? (
        <div className="flex justify-content-end gap-2">
            <Button label="Batal" icon="pi pi-times" outlined onClick={onHide} />
            <Button label="Update" icon="pi pi-check" onClick={handleSubmit} loading={loading} />
        </div>
    ) : null;

    // Menentukan opsi dropdown berdasarkan status awal
    const getStatusOptions = () => {
        if (workOrder?.status === 'open') return ['in_progress'];
        if (workOrder?.status === 'in_progress') return ['completed'];
        return [workOrder?.status]; // Tampilkan status saat ini jika tidak bisa diubah
    };

    return (
        <Dialog
            header={`Update Work Order: ${workOrder?.title || ""}`}
            visible={visible}
            style={{ width: "min(90vw, 600px)" }}
            modal
            onHide={onHide}
            footer={renderFooter}
        >
            {isEditable ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                    {/* --- KONDISI: STATUS AWAL 'OPEN' --- */}
                    {workOrder?.status === 'open' && (
                        <>
                            <div className="field mb-4">
                                <label htmlFor="status" className="font-bold mb-2 block">Update Status Ke</label>
                                <Dropdown id="status" value={formData.status} options={getStatusOptions()} onChange={(e) => handleChange(e, "status")} />
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="started_at" className="font-bold mb-2 block">Tanggal Mulai</label>
                                <Calendar id="started_at" value={formData.started_at} onChange={(e) => handleChange(e, "started_at")} showIcon showTime hourFormat="24" className={formErrors.started_at ? "p-invalid" : ""} />
                                {formErrors.started_at && <Message severity="error" text={formErrors.started_at} className="mt-2" />}
                            </div>
                        </>
                    )}

                    {/* --- KONDISI: STATUS AWAL 'IN_PROGRESS' --- */}
                    {workOrder?.status === 'in_progress' && (
                        <>
                            <div className="field mb-4">
                                <label htmlFor="status" className="font-bold mb-2 block">Update Status Ke</label>
                                <Dropdown id="status" value={formData.status} options={getStatusOptions()} onChange={(e) => handleChange(e, "status")} />
                            </div>
                            <div className="field mb-4">
                                <label htmlFor="completed_at" className="font-bold mb-2 block">Tanggal Selesai</label>
                                <Calendar id="completed_at" value={formData.completed_at} onChange={(e) => handleChange(e, "completed_at")} showIcon showTime hourFormat="24" className={formErrors.completed_at ? "p-invalid" : ""} />
                                {formErrors.completed_at && <Message severity="error" text={formErrors.completed_at} className="mt-2" />}
                            </div>
                        </>
                    )}

                    {/* Field yang selalu ada */}
                    <div className="field mb-4">
                        <label htmlFor="description" className="font-bold mb-2 block">Catatan Pengerjaan</label>
                        <InputTextarea id="description" rows={5} value={formData.description} onChange={(e) => handleChange(e, "description")} autoResize />
                    </div>
                </motion.div>
            ) : (
                <p>Work order ini tidak dapat diupdate lagi karena statusnya sudah '{workOrder?.status}'.</p>
            )}
        </Dialog>
    );
}
